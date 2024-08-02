import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export interface Report {
  address: number;
  address_id: string;
  name: string;
  file_path: string;
  created_at: number;
}

export const ReportsSchema = z.object({
  address: z.string(),
  address_id: z.string(),
  name: z.string(),
  file_path: z.string(),
  created_at: commonValidations.timestamp,
});
