import axios from 'axios';
import fs from 'fs';
import { emojify } from 'node-emoji';
import path from 'path';

import { axiosConfig } from '@/common/utils/axiosConfig';
import { bytesToiB } from '@/common/utils/byteConverter';
import { env } from '@/common/utils/envConfig';

import {
  FlaggedClientsInfo,
  GetVerifiedClients,
  GetVerifiedClientsData,
  GetVerifiedClientsResponse,
  getVerifierClientsDataResponse,
  GetVerifiersDataItem,
  GetVerifiersResponse,
} from './reportModel';

export const reportRepository = {
  generateReport: async (
    verifiersData: GetVerifiersDataItem,
    clientsData: any,
    flaggedClientsInfo: FlaggedClientsInfo[]
  ): Promise<any> => {
    const clientsRows = clientsData.map((e: any) => {
      const totalAllocations = e.allowanceArray.reduce((acc: number, curr: any) => acc + Number(curr.allowance), 0);
      const warning = flaggedClientsInfo.includes(e.addressId) ? emojify(':warning:') : '';
      return `| ${warning} ${e.addressId}| ${e.name} | ${e.allowanceArray.length} | ${bytesToiB(totalAllocations, false)} |`;
    });

    const content: string[] = [];
    content.push('# Compliance Report');

    content.push('## List of clients and their allocations');
    content.push('| ID | Name | Number of Allocations | Total Allocations |');
    content.push('|-|-|-|-|');
    clientsRows.forEach((row: string) => content.push(row));
    content.push('');
    if (flaggedClientsInfo.length > 0)
      content.push(reportRepository.generateFlaggedClientsForReport(flaggedClientsInfo));

    const joinedContent = Buffer.from(content.join('\n')).toString('base64');
    const basepath = env.UPLOADS_DIR + verifiersData.addressId + '/';
    const filePath = path.join(basepath, 'report.md');
    try {
      fs.mkdirSync(basepath, { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(joinedContent, 'base64'));
      return filePath;
    } catch (e) {
      throw new Error('Error writing file');
    }
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
      return data[0];
    } catch (error) {
      throw new Error('Error getting verifier data from datacapstats.io API' + error);
    }
  },
  getVerifierClientsData: async (apiKey: string, verifiersAddressId: string): Promise<GetVerifiedClients[]> => {
    try {
      const { data }: getVerifierClientsDataResponse = await axios.get(
        // Returns a list of verified clients that received datacap from a verifier.
        env.DATACAP_API_URL + `/getVerifiedClients/${verifiersAddressId}`,
        axiosConfig(apiKey, {
          page: 1,
          //TODO: settle amount of clients to be fetched
          limit: 10,
        })
      );

      return data.data;
    } catch (error) {
      throw new Error('Error getting verifier clients data from datacapstats.io API' + error);
    }
  },
  getVerifiedClients: async (id: string, apiKey: string, queryLimit?: string): Promise<GetVerifiedClientsData> => {
    try {
      const { data }: GetVerifiedClientsResponse = await axios.get(
        env.DATACAP_API_URL + `/getVerifiedClients`,
        axiosConfig(apiKey, { page: 1, limit: queryLimit, filter: id })
      );

      return data;
    } catch (error) {
      throw new Error(`Error getting verified clients for id ${id}: ${error}`);
    }
  },
  getFlaggedClients: async (
    apiKey: string,
    VerifierClientsData: GetVerifiedClients[]
  ): Promise<FlaggedClientsInfo[]> => {
    const clientAddressIds = VerifierClientsData.map((e: any) => e.addressId);
    const queryLimit = env.VERIFIED_CLIENTS_QUERY_LIMIT || 20;
    try {
      const responses: GetVerifiedClientsData[] = await Promise.all(
        clientAddressIds.map((id: string) => reportRepository.getVerifiedClients(id, apiKey, queryLimit.toString()))
      );

      const flaggedClientsInfo: FlaggedClientsInfo[] = responses
        .filter(({ count }) => parseInt(count) > 1)
        // there shouldn't be distinct addressIds since we are querying for the same client
        .map(({ data, count }) => {
          return {
            addressId: data[0].addressId,
            queryLimitWarning: parseInt(count) > queryLimit,
          };
        });

      return flaggedClientsInfo;
    } catch (error) {
      throw new Error('Error getting flagged clients data from datacapstats.io API: ' + error);
    }
  },
  generateFlaggedClientsForReport: (flaggedClients: FlaggedClientsInfo[]): string => {
    const reportHeader = `## ${emojify(':warning:')} List of flagged clients that have received datacap from a verifier more than once.`;
    const flaggedClientsList = flaggedClients.map(({ addressId, queryLimitWarning }) => {
      return `* ${addressId} ${queryLimitWarning ? ` - Client have allocations from more than ${env.VERIFIED_CLIENTS_QUERY_LIMIT} ` : ''}`;
    });

    return [reportHeader, ...flaggedClientsList].join('\n');
  },
};
