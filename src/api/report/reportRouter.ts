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

  router.get('/:verifierAddress', async (_req: Request, res: Response) => {
    const serviceResponse = await reportService.generateReport(_req.params.verifierAddress);
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
