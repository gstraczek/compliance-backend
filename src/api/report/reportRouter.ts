import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

import { GetReportSchema, ReportSchema } from './reportModel';
import { reportService } from './reportService';

export const reportRegistry = new OpenAPIRegistry();

reportRegistry.register('Report', ReportSchema);

export const ReportRouter: Router = (() => {
  const router = express.Router();

  reportRegistry.registerPath({
    method: 'get',
    path: '/report/{verifierAddress}',
    tags: ['Report'],
    request: { params: GetReportSchema.shape.params },
    responses: createApiResponse(z.array(ReportSchema), 'Success'),
  });

  reportRegistry.registerPath({
    method: 'get',
    path: '/report/generated/{verifierId}',
    tags: ['Report'],
    request: { params: GetReportSchema.shape.params },
    responses: createApiResponse(z.array(ReportSchema), 'Success'),
  });

  router.get('/generated/:verifierId', async (_req: Request, res: Response) => {
    const renderReport = await reportService.renderReport(_req.params.verifierId);
    handleServiceResponse(renderReport, res);
  });

  router.get('/:verifierAddress', async (_req: Request, res: Response) => {
    const generateReport = await reportService.generateReport(_req.params.verifierAddress);
    handleServiceResponse(generateReport, res);
  });

  return router;
})();
