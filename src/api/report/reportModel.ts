import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { AxiosResponse } from 'axios';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export type Report = z.infer<typeof ReportSchema>;
export const ReportSchema = z.object({
  verifierAddress: z.string(),
});

// Input Validation for 'GET report' endpoint
export const GetReportSchema = z.object({
  params: z.object({ verifierAddress: commonValidations.verifierAddress }),
});

export interface AllowanceArrayItem {
  id: number;
  error: string;
  height: number;
  msgCID: string;
  retries: number;
  addressId: string;
  allowance: string;
  auditTrail: string;
  verifierId: number;
  issueCreateTimestamp: number | null;
  createMessageTimestamp: number;
}

export interface GetVerifiersDataItem {
  id: number;
  addressId: string;
  address: string;
  auditTrail: string;
  retries: number;
  name: string;
  orgName: string;
  removed: boolean;
  initialAllowance: string;
  allowance: string;
  inffered: boolean;
  isMultisig: boolean;
  createdAtHeight: number;
  issueCreateTimestamp: number | null;
  createMessageTimestamp: number;
  verifiedClientsCount: number;
  receivedDatacapChange: string;
  allowanceArray: AllowanceArrayItem[];
}

export interface GetVerifiersData {
  count: string;
  data: GetVerifiersDataItem[];
}

export interface GetVerifiersResponse extends AxiosResponse {
  data: GetVerifiersData;
}
