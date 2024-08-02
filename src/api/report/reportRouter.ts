import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { env } from '@/common/utils/envConfig';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

import { GetReportGenSchema, GetReportSchema, ReportSchema } from './reportModel';
import { reportService } from './reportService';

export const reportRegistry = new OpenAPIRegistry();

reportRegistry.register('Report', ReportSchema);

export const ReportRouter: Router = (() => {
  const router = express.Router();

  if (env.isDev) {
    reportRegistry.registerPath({
      method: 'get',
      path: '/report/{verifierId}/{timestamp}/report.md',
      tags: ['Report'],
      request: { params: GetReportGenSchema.shape.params },
      responses: createApiResponse(z.array(ReportSchema), 'Success'),
    });

    router.get('/:verifierId/:timestamp/report.md', async (_req: Request, res: Response) => {
      const renderReport = await reportService.renderReport(_req.params.verifierId, Number(_req.params.timestamp));
      handleServiceResponse(renderReport, res);
    });
  }

  reportRegistry.registerPath({
    method: 'post',
    path: '/report',
    tags: ['Report'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetReportSchema.shape.body,
          },
        },
      },
    },
    responses: createApiResponse(z.array(ReportSchema), 'Success'),
  });
  router.post('/', async (_req: Request, res: Response) => {
    const generateReport = await reportService.generateReport(_req.body.verifierAddress);
    handleServiceResponse(generateReport, res);
  });

  reportRegistry.registerPath({
    method: 'get',
    path: '/report/{verifierAddress}',
    tags: ['Report'],
    request: {
      params: GetReportSchema.shape.params,
    },
    responses: createApiResponse(z.array(ReportSchema), 'Success'),
  });
  router.get('/:verifierAddress', async (_req: Request, res: Response) => {
    const result = await reportService.getLatestReport(_req.params.verifierAddress);
    handleServiceResponse(result, res);
  });

  return router;
})();
