import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

import { ReportsSchema } from './reportsModel';
import { reportsService } from './reportsService';

export const reportsRegistry = new OpenAPIRegistry();

reportsRegistry.register('Reports', ReportsSchema);

export const ReportsRouter: Router = (() => {
  const router = express.Router();

  reportsRegistry.registerPath({
    method: 'get',
    path: '/reports',
    tags: ['Reports'],
    responses: createApiResponse(z.array(ReportsSchema), 'Success'),
  });

  router.get('/', async (_req: Request, res: Response) => {
    const reports = await reportsService.listReports();
    handleServiceResponse(reports, res);
  });

  return router;
})();
