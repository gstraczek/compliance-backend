import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { readFileSync } from 'fs';
import { marked } from 'marked';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';

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
    const markdown = readFileSync(`uploads/${_req.params.verifierId}/report.md`, 'utf8');
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
    h1, h2, h3 {
      color: #333;
    }
  </style>
  <div class="container">
    ${html}
  </div>
`;
    res.send(styledHtml);
  });

  router.get('/:verifierAddress', async (_req: Request, res: Response) => {
    const p = await reportService.generateReport(_req.params.verifierAddress);
    res.send(`<a href="/report/generated/${p}">Report</a>`);
  });

  return router;
})();
