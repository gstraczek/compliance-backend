import { z } from 'zod';

export const commonValidations = {
  verifierAddress: z.string(),
  verifierId: z.string(),
};
