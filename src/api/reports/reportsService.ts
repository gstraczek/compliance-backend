import { StatusCodes } from 'http-status-codes';

import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

import { reportsRepository } from './reportsRepository';

export const reportsService = {
  listReports: async (): Promise<ServiceResponse<any>> => {
    try {
      const reports = await reportsRepository.getReports();

      return new ServiceResponse(ResponseStatus.Success, 'Reports fetched successfully', reports, StatusCodes.OK);
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while fetching reports: ${error}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
