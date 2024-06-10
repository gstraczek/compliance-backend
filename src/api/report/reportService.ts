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
      const VerifierClientsData = await reportRepository.getVerifierClientsData(apiKey, verifiersData.addressId);
      const flaggedClientsInfo = await reportRepository.getFlaggedClients(apiKey, VerifierClientsData);
      const reports = await reportRepository.generateReport(verifiersData, VerifierClientsData, flaggedClientsInfo);

      return new ServiceResponse<Report[]>(ResponseStatus.Success, 'Reports found', reports, StatusCodes.OK);
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while generating report: ${error}`;
      logger.error(errorMessage);
      //TODO: change the params to match actual github repo
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
