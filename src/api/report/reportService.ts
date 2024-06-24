import { StatusCodes } from 'http-status-codes';
import { emojify } from 'node-emoji';

import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';
import { getApiKey } from '@/common/utils/getApiKey';
import { githubErrorHandle } from '@/common/utils/githubErrorHandle';
import { logger } from '@/server';

import { reportRepository } from './reportRepository';

export const reportService = {
  generateReport: async (verifierAddress: string): Promise<ServiceResponse<any>> => {
    try {
      const apiKey =
        env.DATACAPSTATS_API_KEY && env.DATACAPSTATS_API_KEY !== '' ? env.DATACAPSTATS_API_KEY : await getApiKey();

      const verifiersData = await reportRepository.getVerifiersData(apiKey, verifierAddress);
      const VerifierClients = await reportRepository.getClientsByVerifierId(apiKey, verifiersData.addressId);
      const [flaggedClientsInfo, clientsDeals, grantedDatacapInProviders] = await Promise.all([
        reportRepository.getFlaggedClients(apiKey, VerifierClients.data),
        reportRepository.getClientsDeals(VerifierClients.data),
        reportRepository.getGrantedDatacapInProviders(VerifierClients.data),
      ]);
      const grantedDatacapInClients = reportRepository.getGrantedDatacapInClients(VerifierClients.data);

      await reportRepository.generateReport(
        verifiersData,
        VerifierClients,
        flaggedClientsInfo,
        grantedDatacapInClients,
        clientsDeals,
        grantedDatacapInProviders
      );

      return verifiersData.addressId;
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while generating report: ${error}`;
      logger.error(errorMessage);
      //fixme change to allocator repo
      await githubErrorHandle(
        emojify(':warning:') + 'There was an error while generating report',
        error,
        env.GITHUB_REPO,
        env.GITHUB_OWNER,
        5
      );
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
