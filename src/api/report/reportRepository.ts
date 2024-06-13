import axios from 'axios';
import { LegendOptions } from 'chart.js';
import fs from 'fs';
import { emojify } from 'node-emoji';
import path from 'path';
import xbytes from 'xbytes';

import { axiosConfig } from '@/common/utils/axiosConfig';
import { bytesToiB } from '@/common/utils/byteConverter';
import GenerateBarChart from '@/common/utils/charts/generateBarChart';
import { env } from '@/common/utils/envConfig';

import {
  ClientsByVerifier,
  ClientsByVerifierData,
  FlaggedClientsInfo,
  GetVerifiedClientsResponse,
  getVerifierClientsDataResponse,
  GetVerifiersDataItem,
  GetVerifiersResponse,
  GrantedDatacapByVerifier,
} from './reportModel';
import { reportUtils } from './reportUtils';

export const reportRepository = {
  generateReport: async (
    verifiersData: GetVerifiersDataItem,
    clientsData: ClientsByVerifierData,
    flaggedClientsInfo: FlaggedClientsInfo[],
    grantedDatacapByVerifier: GrantedDatacapByVerifier[]
  ): Promise<any> => {
    const content: string[] = [];
    content.push('# Compliance Report');
    const basepath = env.UPLOADS_DIR + '/' + verifiersData.addressId;
    if (Number(clientsData.count)) {
      const clientsRows = clientsData.data.map((e) => {
        const totalAllocations = e.allowanceArray.reduce((acc: number, curr: any) => acc + Number(curr.allowance), 0);
        const warning = flaggedClientsInfo.find((flaggedClient) => flaggedClient.addressId === e.addressId)
          ? emojify(':warning:')
          : '';
        return `| ${warning} ${e.addressId}| ${e.name} | ${e.allowanceArray.length} | ${bytesToiB(totalAllocations, false)} |`;
      });

      content.push('## Granted Allocation for Clients');
      content.push('');
      content.push('| ID | Allocation Size | Allocation Timestamp |');
      content.push('|-|-|-|');

      const sortedClientsByDate: GrantedDatacapByVerifier[] =
        reportUtils.getSortedClientsByDate(grantedDatacapByVerifier);

      sortedClientsByDate.forEach((row) => {
        const date = new Date(row.allocationTimestamp * 1000).toISOString();
        content.push(`| ${row.addressId} | ${row.clientName} |${xbytes(Number(row.allocation))} | ${date} |`);
      });

      // Generate bar chart image for clients datacap issuance
      const getBarChartImage = await reportRepository.getBarChartImage(grantedDatacapByVerifier);
      reportRepository.uploadFile(basepath, getBarChartImage, 'png');

      content.push('## List of clients and their allocations');
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
          `## There are more than ${env.VERIFIER_CLIENTS_QUERY_LIMIT} clients for a given allocator, report may be inaccurate`
        );
    } else {
      content.push('### No Datacap issued for verifier');
    }
    const joinedContent = Buffer.from(content.join('\n')).toString('base64');
    reportRepository.uploadFile(basepath, joinedContent, 'md');
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

      const clientsData = { data: data.data, count: data.count };
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

  getGrantedDatacapByVerifier: (VerifierClientsData: ClientsByVerifier[]): GrantedDatacapByVerifier[] => {
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

  getBarChartImage: async (grantedDatacapByVerifier: GrantedDatacapByVerifier[]) => {
    const legendOpts: Partial<LegendOptions<'bar'> & { labels: any }> = {
      display: true,
      labels: {
        generateLabels: () => [],
      },
    };
    const prepareTimestamp = grantedDatacapByVerifier.map((e) => {
      const date = new Date(e.allocationTimestamp * 1000);
      date.setHours(0, 0, 0, 0);
      const formattedDate = date.getTime();
      return { ...e, allocationTimestamp: formattedDate };
    });

    const groupedByallocationTimestamp = prepareTimestamp.reduce(
      (groups: Record<string, typeof grantedDatacapByVerifier>, allocation) => {
        const key = allocation.allocationTimestamp;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(allocation);
        return groups;
      },
      {}
    );

    const randomizeColor = () => {
      const base = 128;
      const range = 127;
      const r = (base + Math.abs(Math.sin(Math.random() + 1) * range)) | 0;
      const g = (base + Math.abs(Math.sin(Math.random() + 2) * range)) | 0;
      const b = (base + Math.abs(Math.sin(Math.random() + 3) * range)) | 0;
      return `rgba(${r}, ${g}, ${b})`;
    };

    const datasets = Object.entries(groupedByallocationTimestamp).map(([allocationTimestamp, allocations]) => ({
      label: allocationTimestamp,
      data: allocations.map((allocation) => ({
        x: allocation.allocationTimestamp,
        y: allocation.allocation,
        label: allocation.addressId,
      })),
      backgroundColor: allocations.map(() => randomizeColor()),
      borderWidth: 1,
      barThickness: 80,
    }));

    return GenerateBarChart.getBase64Image(datasets, {
      title: 'Size of Datacap issuance over time by client address ID',
      titleYText: 'Size of Issuance',
      titleXText: 'Date of Issuance',
      legendOpts,
      width: 3500,
    });
  },
  uploadFile: async (basepath: string, base64: string, ext: string) => {
    const filePath = path.join(basepath, `report.${ext}`);
    try {
      fs.mkdirSync(basepath, { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
      return filePath;
    } catch (e) {
      throw new Error('Error writing file');
    }
  },
};
