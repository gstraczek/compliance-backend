import { resolve4, resolve6 } from 'node:dns';

import axios from 'axios';
import { LegendOptions } from 'chart.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
let arraystat: any;

import('arraystat').then((module) => {
  arraystat = module.default;
});

import fs from 'fs';
import { Multiaddr } from 'multiaddr';
import { emojify } from 'node-emoji';
import path from 'path';
import xbytes from 'xbytes';

import { axiosConfig } from '@/common/utils/axiosConfig';
import GenerateChart, { BarChartEntry } from '@/common/utils/charts/generateChart';
import GeoMap from '@/common/utils/charts/geoMap';
import { clientDealsQuery, providerDistributionQuery } from '@/common/utils/dbQuery';
import { env } from '@/common/utils/envConfig';
import { getCurrentEpoch, heightToUnix } from '@/common/utils/filplusEpoch';
import { isNotEmpty } from '@/common/utils/typeGuards';
import { db } from '@/db';
import { logger } from '@/server';

import {
  ClientsByVerifier,
  ClientsByVerifierData,
  ClientsDeals,
  FlaggedClientsInfo,
  GeoMapEntry,
  GetVerifiedClientsResponse,
  getVerifierClientsDataResponse,
  GetVerifiersDataItem,
  GetVerifiersResponse,
  GrantedDatacapInClients,
  Location,
  MinerInfo,
  ProviderDistribution,
  ProviderDistributionTable,
  Retrievability,
  SparkSuccessRate,
} from './reportModel';
import { reportUtils } from './reportUtils';

export const reportRepository = {
  generateReport: async (
    verifiersData: GetVerifiersDataItem,
    clientsData: ClientsByVerifierData,
    flaggedClientsInfo: FlaggedClientsInfo[],
    grantedDatacapInClients: GrantedDatacapInClients[],
    clientsDeals: ClientsDeals[],
    grantedDatacapInProviders: ProviderDistributionTable[]
  ): Promise<any> => {
    const content: string[] = [];
    content.push('# Compliance Report');

    if (Number(clientsData.count)) {
      const clientsRows = clientsData.data.map((e) => {
        const totalAllocations = e.allowanceArray.reduce((acc: number, curr: any) => acc + Number(curr.allowance), 0);
        const warning = flaggedClientsInfo.find((flaggedClient) => flaggedClient.addressId === e.addressId)
          ? emojify(':warning:')
          : '';
        return `| ${warning} ${e.addressId}| ${e.name || '-'} | ${e.allowanceArray.length} | ${xbytes(totalAllocations, { iec: true })} |`;
      });

      content.push('## Distribution of Datacap in Clients');
      content.push('');
      const getDatacapInClientsDist = reportUtils.datacapInClients(grantedDatacapInClients);
      const getDatacapInClientsChart = await reportRepository.getDatacapInClientsChart(
        getDatacapInClientsDist,
        clientsDeals
      );

      //generate histogram images based on clients allocation and deals made
      getDatacapInClientsChart.map(async (chart, idx) => {
        const filePath = await reportRepository.saveFile(
          chart,
          `${verifiersData.addressId}/datacap_in_clients/histogram_${idx}.png`
        );
        content.push('');
        content.push(`<div class="histogram"><img src=/${filePath}></div>`);
        content.push('');
      });

      //calculate distinct sizes of allocations table
      const distinctSizesOfAllocations = reportUtils.distinctSizesOfAllocations(grantedDatacapInClients);
      content.push(distinctSizesOfAllocations);

      // Generate bar chart image for clients datacap issuance
      content.push('');
      content.push('## List of clients and their allocations');
      content.push('');
      content.push('| ID | Name | Number of Allocations | Total Allocations |');
      content.push('|-|-|-|-|');
      clientsRows.forEach((row: string) => content.push(row));
      content.push('');

      if (flaggedClientsInfo.length > 0) {
        content.push(`### Clients with ${emojify(':warning:')} flag received datacap from more than one verifier`);
        content.push('');
      }

      if (Number(clientsData.count) > env.VERIFIER_CLIENTS_QUERY_LIMIT)
        content.push(
          `## ${emojify(':warning:')} There are more than ${env.VERIFIER_CLIENTS_QUERY_LIMIT} clients for a given allocator, report may be inaccurate`
        );

      content.push('## Histograms of time passed until the part of the allocation is used by the clients');
      content.push('');

      const getBarChartImage = await reportRepository.getBarChartImage(grantedDatacapInClients);
      const barChartUrl = await reportRepository.saveFile(
        getBarChartImage,
        `${verifiersData.addressId}/issuance_chart.png`
      );
      content.push(`<img src="/${barChartUrl}"/>`);
      content.push('');

      content.push('## Distribution of Datacap in Storage Providers');
      content.push('');
      content.push(
        '| Provider | Location | Total Deals Sealed | Percentage of Total Datacap | Retrieval Success Rate |'
      );
      content.push('|-|-|-|-|-|');
      grantedDatacapInProviders.forEach((provider) => {
        content.push(
          `| ${provider.provider} | ${provider.location?.city || '-'} | ${provider.total_sealed_deals.toString()} | ${provider.percentage.toFixed(
            2
          )} % | ${provider.retrieval_success_rate || '-'} |`
        );
      });

      // Generate image for provider distribution
      const providersGeoMap = reportRepository.getImageForProviderDistribution(grantedDatacapInProviders);

      const geoMapUrl = await reportRepository.saveFile(
        providersGeoMap,
        `${verifiersData.addressId}/providers_distribution_geomap.png`
      );
      content.push('');
      content.push('## Location of Clients and Storage Providers with the Percentage of Total Datacap Displayed');
      content.push(`<img src="/${geoMapUrl}"/>`);
    } else {
      content.push('### No Datacap issued for verifier');
    }
    const joinedContent = Buffer.from(content.join('\n')).toString('base64');
    const reportUrl = await reportRepository.saveFile(joinedContent, `${verifiersData.addressId}/report.md`);
    return reportUrl;
  },

  getVerifiersData: async (apiKey: string, verifierAddress: string): Promise<GetVerifiersDataItem> => {
    try {
      const {
        data: { data },
      }: GetVerifiersResponse = await axios.get(
        env.DATACAP_API_URL + '/getVerifiers',
        axiosConfig(apiKey, {
          page: 1,
          limit: 1,
          filter: verifierAddress,
        })
      );
      const verifiersData = data[0];
      if (!verifiersData) {
        throw new Error('Verifier not found');
      }
      return verifiersData;
    } catch (error) {
      throw new Error('Error getting verifier data from datacapstats.io API' + error);
    }
  },
  getClientsByVerifierId: async (apiKey: string, verifiersAddressId: string) => {
    try {
      const { data }: getVerifierClientsDataResponse = await axios.get(
        // Returns a list of verified clients that received datacap from a verifier.
        env.DATACAP_API_URL + `/getVerifiedClients/${verifiersAddressId}`,
        axiosConfig(apiKey, {
          page: 1,
          limit: env.VERIFIER_CLIENTS_QUERY_LIMIT || 20,
        })
      );

      const clientsData = {
        data: data.data.map((e) => ({
          ...e,
          allowanceArray: e.allowanceArray.map((a) => ({
            ...a,
            allowance: Number(a.allowance),
          })),
        })),
        count: data.count,
      };
      if (!clientsData.data) {
        throw new Error('Clients not found for verifier' + verifiersAddressId);
      }
      return clientsData;
    } catch (error) {
      throw new Error('Error getting verifier clients data from datacapstats.io API' + error);
    }
  },
  getClientsByClientId: async (id: string, apiKey: string): Promise<ClientsByVerifierData> => {
    try {
      const { data }: GetVerifiedClientsResponse = await axios.get(
        env.DATACAP_API_URL + `/getVerifiedClients`,
        axiosConfig(apiKey, { page: 1, limit: 2, filter: id })
      );

      return data;
    } catch (error) {
      throw new Error(`Error getting verified clients for id ${id}: ${error}`);
    }
  },
  getFlaggedClients: async (
    apiKey: string,
    VerifierClientsData: ClientsByVerifier[]
  ): Promise<FlaggedClientsInfo[]> => {
    const clientAddressIds = VerifierClientsData.map((e) => e.addressId);
    try {
      const responses: ClientsByVerifierData[] = await Promise.all(
        clientAddressIds.map((id: string) => reportRepository.getClientsByClientId(id, apiKey))
      );

      const flaggedClientsInfo = responses
        .filter(({ count }) => Number(count) > 1)
        .map(({ data }) => ({ addressId: data[0].addressId }));

      return flaggedClientsInfo;
    } catch (error) {
      throw new Error('Error getting flagged clients data from datacapstats.io API: ' + error);
    }
  },

  getGrantedDatacapInProviders: async (VerifierClientsData: ClientsByVerifier[]) => {
    const distribution = await reportRepository.getStorageProvidersDistribution(
      VerifierClientsData.map((e) => e.addressId)
    );
    return distribution;
  },

  getGrantedDatacapInClients: (VerifierClientsData: ClientsByVerifier[]): GrantedDatacapInClients[] => {
    const ClientsData = VerifierClientsData.map((e) => ({
      addressId: e.addressId,
      allowanceArray: e.allowanceArray,
      clientName: e.name,
    }));
    const allowancePerClient = ClientsData.map((item) => {
      return item.allowanceArray.map((allowanceItem) => ({
        allocation: allowanceItem.allowance,
        addressId: item.addressId,
        allocationTimestamp: allowanceItem.createMessageTimestamp,
        clientName: item.clientName,
      }));
    }).flat();

    return allowancePerClient;
  },

  getStorageProvidersDistribution: async (clients: string[]): Promise<ProviderDistributionTable[] | []> => {
    const currentEpoch = getCurrentEpoch();
    logger.info({ clients, currentEpoch }, 'Getting storage provider distribution');
    const queryResult = await db.query(providerDistributionQuery, [clients, currentEpoch]);
    const distributions: ProviderDistribution[] = queryResult.rows;
    const providers = distributions.map((r) => r.provider);
    if (providers.length === 0) {
      logger.debug('No storage providers found for' + clients);
      return [];
    }
    logger.debug({ distributions }, 'Got Storage provider distribution');

    const total = distributions.reduce((acc, cur) => acc + parseFloat(cur.total_deal_size), 0);

    const ProvidersDistribution: ProviderDistributionTable[] = [];
    const providersRetrievability = await reportRepository.providersRetrievability(
      distributions,
      env.RETRIEVABILITY_RANGE_DAYS
    );

    for (const item of distributions) {
      const location = await reportRepository.getLocation(item.provider);
      const retrieval_success_rate =
        providersRetrievability.retrievability.find((x) => x.provider_id === item.provider)?.success_rate || null;

      // parse float???
      const total_sealed_deals = xbytes(parseFloat(item.total_deal_size), { iec: true });
      const percentage = (parseFloat(item.total_deal_size) / total) * 100;

      ProvidersDistribution.push({
        provider: item.provider,
        location,
        retrieval_success_rate,
        total_sealed_deals,
        percentage,
      });
    }
    return ProvidersDistribution;
  },

  providersRetrievability: async (
    providerDistributions: ProviderDistribution[],
    retrievabilityRange: number
  ): Promise<{ retrievability: Retrievability[]; avgProviderScore: number }> => {
    try {
      const from = new Date(Date.now() - retrievabilityRange * 24 * 3600 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const sparkData = await reportRepository.fetchRetrievalSuccessRate(from, to);

      const retrievability = reportRepository.createRetrievability(providerDistributions, sparkData);
      if (retrievability.length === 0) return { retrievability: [], avgProviderScore: 0 };

      const avgProviderScore = reportRepository.calculateAvgProviderScore(retrievability);

      return { retrievability, avgProviderScore };
    } catch (error) {
      logger.error('Error getting retrievability data: ' + error);
      return { retrievability: [], avgProviderScore: 0 };
    }
  },

  calculateAvgProviderScore: (matchedRetrievability: Retrievability[]): number => {
    const { totalClientDealSize, totalSuccessRate } = matchedRetrievability.reduce(
      (acc, { total_deal_size, success_rate }) => {
        acc.totalClientDealSize += total_deal_size;
        acc.totalSuccessRate += success_rate * total_deal_size;
        return acc;
      },
      { totalClientDealSize: 0, totalSuccessRate: 0 }
    );

    if (totalSuccessRate === 0 || totalClientDealSize === 0) return 0;
    return totalSuccessRate / totalClientDealSize;
  },

  createRetrievability: (
    providerDistributions: ProviderDistribution[],
    sparkData: SparkSuccessRate[]
  ): Retrievability[] => {
    const retrievability = providerDistributions
      .map(({ provider, total_deal_size }) => {
        const sparkItem = sparkData.find((x) => x.miner_id === provider);

        if (!sparkItem) return null;

        return {
          provider_id: sparkItem.miner_id,
          success_rate: sparkItem.success_rate,
          total_deal_size: Number(total_deal_size),
        };
      })
      .filter(isNotEmpty);

    return retrievability;
  },

  fetchRetrievalSuccessRate: async (from: string, to: string): Promise<SparkSuccessRate[]> => {
    const response = await axios.get(
      `https://stats.filspark.com/miners/retrieval-success-rate/summary?from=${from}&to=${to}`
    );
    const sparkData: SparkSuccessRate[] = response.data;

    return sparkData;
  },

  getLocation: async (provider: string): Promise<Location | null> => {
    const minerInfo = await reportRepository.getMinerInfo(provider);
    if (minerInfo.Multiaddrs == null || minerInfo.Multiaddrs.length === 0) {
      return null;
    }
    const ips: string[] = [];
    for (const multiAddr of minerInfo.Multiaddrs) {
      logger.info({ multiAddr }, 'Getting IP from multiaddr');
      try {
        const ip = await reportRepository.getIpFromMultiaddr(multiAddr);
        ips.push(...ip);
      } catch (e) {
        logger.warn({ multiAddr, e }, 'Failed to get IP from multiaddr');
        return null;
      }
    }
    for (const ip of ips) {
      logger.info({ ip }, 'Getting location for IP');
      const { data } = await axios.get(`https://ipinfo.io/${ip}?token=${env.IP_INFO_TOKEN}`);
      if (data.bogon === true) {
        continue;
      }
      logger.info({ ip, data }, 'Got location for IP');
      return {
        city: data.city,
        country: data.country,
        region: data.region,
        latitude: data.loc != null ? parseFloat(data.loc.split(',')[0]) : undefined,
        longitude: data.loc != null ? parseFloat(data.loc.split(',')[1]) : undefined,
        orgName: data.org != null ? data.org.split(' ').slice(1).join(' ') : 'Unknown',
      };
    }
    return null;
  },

  getIpFromMultiaddr: async (multiAddr: string): Promise<string[]> => {
    const m = new Multiaddr(Buffer.from(multiAddr, 'base64'));
    const address = m.nodeAddress().address;
    const proto = m.protos()[0].name;
    switch (proto) {
      case 'dns4':
        return resolve4.__promisify__(address);
      case 'dns6':
        return resolve6.__promisify__(address);
      case 'ip4':
      case 'ip6':
        return [address];
      default:
        logger.error({ multiAddr }, 'Unknown protocol');
        return [];
    }
  },

  getMinerInfo: async (miner: string): Promise<MinerInfo> => {
    logger.info({ miner }, 'Getting miner info');

    const response = await axios.post('https://api.node.glif.io/rpc/v0', {
      jsonrpc: '2.0',
      id: 1,
      method: 'Filecoin.StateMinerInfo',
      params: [miner, null],
    });
    return response.data.result;
  },

  getClientsDeals: async (verifierClientsData: ClientsByVerifier[]): Promise<ClientsDeals[]> => {
    const clientAddressIds = verifierClientsData.map((e) => e.addressId);
    try {
      db.connect();

      const values = [clientAddressIds];

      const result = await db.query(clientDealsQuery, values);

      const data = result.rows.map((row) => ({
        ...row,
        deal_timestamp: heightToUnix(Number(row.deal_timestamp)),
        deal_value: BigInt(row.deal_value),
      }));
      return data;
    } catch (error) {
      throw new Error('Error getting clients deals data from the DB: ' + error);
    }
  },

  getDatacapInClientsChart: async (
    clientInfo: {
      addressId: string;
      allocations: {
        allocation: number;
        allocationTimestamp: number;
      }[];
    }[],
    clientsDeals: ClientsDeals[]
  ) => {
    const allocationDeals: Record<string, number[]> = {
      first: [],
      half: [],
      third: [],
      full: [],
    };

    const groupedClientDeals = clientsDeals.reduce((groups: Record<string, ClientsDeals[]>, deal) => {
      const key = deal.client_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(deal);
      return groups;
    }, {});

    clientInfo.forEach((client) => {
      let dealIdx = 0;
      for (const { allocation, allocationTimestamp } of client.allocations) {
        let allocationUsed = 0n;
        let threshold = 0;
        for (let i = dealIdx; i < groupedClientDeals[client.addressId]?.length; i++) {
          const deal = clientsDeals[i];

          allocationUsed += deal.deal_value;
          if (threshold === 0) {
            const dealDate = dayjs.unix(deal.deal_timestamp);
            const allocationDate = dayjs.unix(allocationTimestamp);
            allocationDeals.first.push(dealDate.diff(allocationDate, 'days'));
            threshold = 1;
          } else if (threshold === 1 && allocationUsed >= allocation * 0.5) {
            const dealDate = dayjs.unix(deal.deal_timestamp);
            const allocationDate = dayjs.unix(allocationTimestamp);
            allocationDeals.half.push(dealDate.diff(allocationDate, 'days'));
            threshold = 2;
          } else if (threshold === 2 && allocationUsed >= allocation * 0.75) {
            const dealDate = dayjs.unix(deal.deal_timestamp);
            const allocationDate = dayjs.unix(allocationTimestamp);
            allocationDeals.third.push(dealDate.diff(allocationDate, 'days'));
            threshold = 3;
          } else if (threshold === 3 && allocationUsed >= allocation) {
            const dealDate = dayjs.unix(deal.deal_timestamp);
            const allocationDate = dayjs.unix(allocationTimestamp);
            allocationDeals.full.push(dealDate.diff(allocationDate, 'days'));
            threshold = 4;
            dealIdx = i + 1;
            break;
          }
        }
      }
    });

    const chartData = Object.keys(allocationDeals).reduce((acc: Record<string, { x: string; y: number }[]>, key) => {
      if (allocationDeals[key].length === 1) {
        acc[key] = [];
      } else {
        acc[key] = arraystat(allocationDeals[key]).histogram?.map((data: { min: number; max: number; nb: number }) => {
          return {
            x: `${Math.floor(data.min)} - ${Math.floor(data.max)}`,
            y: data.nb,
          };
        });
      }
      return acc;
    }, {});

    const charts: string[] = Object.keys(chartData).map((key) => {
      const datasets: BarChartEntry[] = [
        {
          backgroundColor: chartData[key]?.map(() => reportUtils.randomizeColor()),
          data: chartData[key],
          categoryPercentage: 1,
          barPercentage: 1,
        },
      ];
      let title = '';
      switch (key) {
        case 'first':
          title = "Time elapsed until the client's first deal was made";
          break;
        case 'half':
          title = 'Time elapsed until half of the allocation was used';
          break;
        case 'third':
          title = 'Time elapsed until three quarters of the allocation was used';
          break;
        case 'full':
          title = 'Time elapsed until the entire allocation was used';
          break;
      }

      return new GenerateChart().getBase64HistogramImage(datasets, {
        labels: chartData[key]?.map((e) => e.x),
        title,
        titleYText: 'Number of Allocations',
        titleXText: `Time from Allocation issuance (days)`,
        width: 2000,
      });
    });

    return charts;
  },

  getBarChartImage: async (grantedDatacapInClients: GrantedDatacapInClients[]) => {
    const legendOpts: Partial<LegendOptions<'bar'> & { labels: any }> = {
      display: true,
      labels: {
        generateLabels: () => [],
      },
    };
    const preparedTimestamp = grantedDatacapInClients
      .map((e) => {
        const formattedDate = dayjs(e.allocationTimestamp * 1000)
          .startOf('day')
          .valueOf();
        return { ...e, allocationTimestamp: formattedDate };
      })
      .sort((a, b) => a.allocationTimestamp - b.allocationTimestamp);

    const groupedByAllocationTimestamp = preparedTimestamp.reduce(
      (groups: Record<string, typeof grantedDatacapInClients>, allocation) => {
        const key = dayjs(allocation.allocationTimestamp).format('YYYY-MM-DD');
        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(allocation);
        return groups;
      },
      {}
    );
    const data = Object.entries(groupedByAllocationTimestamp).map(([allocationTimestamp, allocations]) => {
      return {
        x: allocationTimestamp,
        y: allocations.reduce((acc, curr) => acc + curr.allocation, 0),
      };
    });

    const datasets = [
      {
        data: data,
        backgroundColor: data.map(() => '#DFFF00'),
        borderWidth: 2,
      },
    ];

    return new GenerateChart().getBase64Image(datasets, {
      title: 'Size of Datacap issuance over time',
      titleYText: 'Size of Issuance',
      titleXText: 'Date of Issuance',
      legendOpts,
      width: 2000,
      labels: data.map((e) => e.x),
    });
  },

  saveFile: async (base64Content: string, name: string): Promise<string> => {
    const filePath = path.join(env.UPLOADS_DIR, name);

    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
      return filePath;
    } catch (e) {
      logger.error('Error uploading file %s: %s', filePath, e);
      return '';
    }
  },

  getImageForProviderDistribution(providerDistributions: ProviderDistributionTable[]): string {
    const geoMapEntries: GeoMapEntry[] = [];

    for (const distribution of providerDistributions) {
      if (distribution.location?.longitude != null && distribution.location?.latitude != null) {
        geoMapEntries.push({
          longitude: distribution.location.longitude,
          latitude: distribution.location.latitude,
          value: Math.floor(distribution.percentage),
          label: distribution.provider,
        });
      }
    }
    return GeoMap.getImage(geoMapEntries);
  },
  constructBasepath: (uploadDir: string | undefined, addressId: string): string => {
    return uploadDir ? `${uploadDir}/${addressId}` : addressId;
  },
};
