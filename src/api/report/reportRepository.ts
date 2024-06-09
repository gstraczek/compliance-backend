import axios from 'axios';
import fs from 'fs';
import { emojify } from 'node-emoji';
import path from 'path';

import { axiosConfig } from '@/common/utils/axiosConfig';

import { GetVerifiersDataItem, GetVerifiersResponse } from './reportModel';

export const reportRepository = {
  generateReport: async (clientsData: any, flaggedClients: string[]): Promise<any> => {
    const clientsRows = clientsData.map((e: any) => {
      const totalAllocations = e.allowanceArray.reduce((acc: number, curr: any) => acc + Number(curr.allowance), 0);
      return `|${e.addressId}|${e.allowanceArray.length}|${totalAllocations}|`;
    });

    const content: string[] = [];
    content.push('# Compliance Report');
    if (flaggedClients.length > 0) content.push(reportRepository.generateFlaggedClientsForReport(flaggedClients));

    content.push(' Flagged clients: ' + flaggedClients.join(', '));
    content.push('');
    content.push('## List of clients and their allocations');
    content.push('| ID | Name | Number of Allocations | Total Allocations |');
    content.push('|-|-|-|-|');
    content.push(clientsRows);
    const joinedContent = Buffer.from(content.join('\n')).toString('base64');
    const basepath = './src/uploads';
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
        'http://api.datacapstats.io/public/api/getVerifiers',
        axiosConfig(apiKey, {
          page: 0,
          limit: 1,
          filter: verifierAddress,
        })
      );
      return data[0];
    } catch (error) {
      throw new Error('Error getting verifier data from datacapstats.io API' + error);
    }
  },
  getVerifierClientsData: async (apiKey: string, verifiersAddressId: any): Promise<any> => {
    try {
      const { data } = await axios.get(
        // Returns a list of verified clients that received datacap from a verifier.
        `http://api.datacapstats.io/public/api/getVerifiedClients/${verifiersAddressId}`,
        axiosConfig(apiKey, {
          page: 0,
          //TODO: settle amount of clients to be fetched
          limit: 10,
        })
      );
      return data.data;
    } catch (error) {
      throw new Error('Error getting verifier clients data from datacapstats.io API' + error);
    }
  },
  getVerifiedClients: async (id: string, apiKey: string): Promise<any> => {
    try {
      const response = await axios.get(
        `http://api.datacapstats.io/public/api/getVerifiedClients/${id}`,
        //TODO: how many of them are possible to fetch
        axiosConfig(apiKey, { page: 0, limit: 10 })
      );
      return response;
    } catch (error) {
      throw new Error(`Error getting verified clients for id ${id}: ${error}`);
    }
  },
  getFlaggedClients: async (apiKey: string, VerifierClientsData: any): Promise<string[]> => {
    const clientAddressIds = VerifierClientsData.map((e: any) => e.addressId);
    try {
      const responses = await Promise.all(
        clientAddressIds.map((id: string) => reportRepository.getVerifiedClients(id, apiKey))
      );
      const addressIds = responses
        .filter(({ data: { count } }) => parseInt(count) > 1)
        .map(({ data: { data } }) => data.addressId);
      return addressIds;
    } catch (error) {
      throw new Error('Error getting flagged clients data from datacapstats.io API: ' + error);
    }
  },
  generateFlaggedClientsForReport: (flaggedClients: string[]): string => {
    const reportHeader = `## ${emojify(':warning')} List of flagged clients that have received datacap from a verifier more than once.`;
    const flaggedClientsList = flaggedClients.map((client: string) => `* ${client}`);
    return [reportHeader, ...flaggedClientsList].join('\n');
  },
};
