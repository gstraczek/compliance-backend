import { z } from 'zod';

export const commonValidations = {
  verifierAddress: z.string(),
  uploadId: z.string(),
};
