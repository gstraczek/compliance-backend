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

export interface ClientsDeals {
  deal_value: bigint;
  deal_timestamp: number;
  client_id: string;
}

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

export interface Allowance {
  id: number;
  error: string;
  height: number;
  msgCID: string;
  retries: number;
  addressId: string;
  allowance: number;
  auditTrail: null | string;
  allowanceTTD: null | string;
  usedAllowance: string;
  isLdnAllowance: boolean;
  isEFilAllowance: boolean;
  verifierAddressId: string;
  isFromAutoverifier: boolean;
  searchedByProposal: boolean;
  issueCreateTimestamp: null | string;
  hasRemainingAllowance: boolean;
  createMessageTimestamp: number;
}

export interface ClientsByVerifier {
  id: number;
  addressId: string;
  address: string;
  retries: number;
  auditTrail: string;
  name: null | string;
  orgName: null | string;
  initialAllowance: string;
  allowance: string;
  verifierAddressId: string;
  createdAtHeight: number;
  issueCreateTimestamp: null | string;
  createMessageTimestamp: number;
  verifierName: null | string;
  dealCount: number;
  providerCount: number;
  topProvider: string;
  receivedDatacapChange: string;
  usedDatacapChange: string;
  allowanceArray: Allowance[];
}

export interface ClientsByVerifierData {
  count: string;
  data: ClientsByVerifier[];
  ldnActivityCount?: number;
}
export interface FlaggedClientsInfo {
  addressId: string;
}

export interface GetVerifiedClientsResponse {
  data: ClientsByVerifierData;
}

export interface getVerifierClientsData {
  count: string;
  data: ClientsByVerifier[];
  ldnActivityCount: number;
  name: null | string;
  remainingDatacap: string;
  addressId: string;
}

export interface getVerifierClientsDataResponse extends AxiosResponse {
  data: ClientsByVerifierData;
}

export interface GrantedDatacapInClients {
  allocation: number;
  addressId: string;
  allocationTimestamp: number;
}

export interface ProviderDistribution {
  provider: string;
  total_deal_size: string;
  unique_data_size: string;
  duplication_percentage: number;
  percentage: number;
  retrieval_success_rate: number | string;
  total_sealed_deals: bigint;
}

export interface Location {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  orgName?: string;
}

export interface ProviderDistributionTable {
  provider: string;
  percentage: number;
  retrieval_success_rate: number | null;
  total_sealed_deals: string;
  location: Location | null;
}

export interface MinerInfo {
  PeerId: string;
  Multiaddrs: string[] | null | undefined;
  SectorSize: number;
}

export interface Retrievability {
  provider_id: string;
  success_rate: number;
  total_deal_size: number;
}

export interface SparkSuccessRate {
  miner_id: string;
  success_rate: number;
}

export interface GeoMapEntry {
  label: string;
  value: number;
  latitude: number;
  longitude: number;
}
