import { readFileSync } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { marked } from 'marked';

import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';
import { getApiKey } from '@/common/utils/getApiKey';
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
      const generateReportUrl = `<a rel="noopener noreferrer" href="${env.APP_BASE_URL}/report/generated/${verifiersData.addressId}">Check Full Allocator Report</a>`;

      return new ServiceResponse(
        ResponseStatus.Success,
        'Report generated successfully',
        generateReportUrl,
        StatusCodes.OK,
        'text/html'
      );
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while generating report: ${error}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
  renderReport: async (verifierId: string): Promise<ServiceResponse<any>> => {
    try {
      const markdown = readFileSync(`${env.UPLOADS_DIR + verifierId}/report.md`, 'utf8');
      const html = marked(markdown);
      const styledHtml = `
      <style>
      body {
        font-family: Arial, sans-serif;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 2rem;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
      }
      .container {
        max-width: 112rem;
        margin: 5rem auto;
        padding: 4rem;
        border: 1px solid #eaecef;
        position: relative;
        width: 100%;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      .histogram{
        display: inline-block;
        width: 47%;
        box-sizing: border-box;
        margin: 2% 0;
      }
      .histogram:nth-of-type(1),
      .histogram:nth-of-type(3) {
        margin-right: 5%;
      }
      h1, h2, h3 {
        color: #333;
      }
    </style>
    <div class="container">
      ${html}
    </div>
  `;
      return new ServiceResponse(
        ResponseStatus.Success,
        'Report rendered successfully',
        styledHtml,
        StatusCodes.OK,
        'text/html'
      );
    } catch (ex) {
      const error = (ex as Error).message;
      const errorMessage = `There was an error while rendering report: ${error}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
