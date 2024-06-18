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
      const flaggedClientsInfo = await reportRepository.getFlaggedClients(apiKey, VerifierClients.data);
      const grantedDatacapByVerifier = reportRepository.getGrantedDatacapByVerifier(VerifierClients.data);
      const clientsDeals = await reportRepository.getClientsDeals(VerifierClients.data);

      const reports = await reportRepository.generateReport(
        verifiersData,
        VerifierClients,
        flaggedClientsInfo,
        grantedDatacapByVerifier,
        clientsDeals
      );

      return new ServiceResponse<Report[]>(ResponseStatus.Success, 'Reports found', reports, StatusCodes.OK);
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while generating report: ${error}`;
      logger.error(errorMessage);
      //fixme change to allocator repo
      await githubErrorHandle(
        emojify(':warning:') + 'There was an error while generating report',
        error,
        'gstraczek',
        'wegiel',
        1
      );
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
