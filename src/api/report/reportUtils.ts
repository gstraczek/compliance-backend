import xbytes from 'xbytes';

import { GrantedDatacapByVerifier } from './reportModel';

export const reportUtils = {
  distinctSizesOfAllocations: (grantedDatacapByVerifier: GrantedDatacapByVerifier[]) => {
    const groupedByAddressId = groupByAddressId(grantedDatacapByVerifier);
    const groupsSortedByTimestamp = sortGroupsByTimestamp(groupedByAddressId);
    return createContent(groupsSortedByTimestamp);
  },
  datacapInClients: (grantedDatacapByVerifier: GrantedDatacapByVerifier[]) => {
    const groupedByAddressId = groupByAddressId(grantedDatacapByVerifier);
    const groupsSortedByTimestamp = sortGroupsByTimestamp(groupedByAddressId);
    return groupsSortedByTimestamp;
  },
  randomizeColor: () => {
    const base = 128;
    const range = 127;
    const r = (base + Math.abs(Math.sin(Math.random() + 1) * range)) | 0;
    const g = (base + Math.abs(Math.sin(Math.random() + 2) * range)) | 0;
    const b = (base + Math.abs(Math.sin(Math.random() + 3) * range)) | 0;
    return `rgba(${r}, ${g}, ${b})`;
  },
};

const groupByAddressId = (grantedDatacapByVerifier: GrantedDatacapByVerifier[]) =>
  grantedDatacapByVerifier.reduce(
    (groups: Record<string, { allocation: number; allocationTimestamp: number }[]>, allocation) => {
      const key = allocation.addressId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({
        allocation: allocation.allocation,
        allocationTimestamp: allocation.allocationTimestamp,
      });
      return groups;
    },
    {}
  );

const sortGroupsByTimestamp = (
  groupedByAddressId: Record<string, { allocation: number; allocationTimestamp: number }[]>
) =>
  Object.entries(groupedByAddressId).map(([addressId, allocations]) => ({
    addressId,
    allocations: allocations.sort((a, b) => a.allocationTimestamp - b.allocationTimestamp),
  }));

const createContent = (
  groupsSortedByTimestamp: { addressId: string; allocations: { allocation: number; allocationTimestamp: number }[] }[]
) => {
  const content = [];
  content.push('## Granted Allocation for Clients');
  content.push('');
  content.push(
    '### The table below shows the allocations for each client. The percentage next to each allocation represents the increase or decrease compared to the previous allocation.'
  );
  content.push('');
  content.push('| ID | First Allocation | Second Allocation | Third Allocation | Remaining Allocations |');
  content.push('|-|-|-|-|-|');

  groupsSortedByTimestamp.map(({ addressId, allocations }) => {
    const allocationWithPercentage = allocations.map((allocation, index) => {
      if (index === 0) {
        return xbytes(Number(allocation.allocation));
      }
      const previousAllocation = Number(allocations[index - 1].allocation);
      const currentAllocation = Number(allocation.allocation);
      const percentage = (currentAllocation / previousAllocation) * 100;
      return `${xbytes(currentAllocation)} (${percentage}%)`;
    });

    const remainingAllocations = allocations.slice(3);
    const remainingAlloc =
      remainingAllocations.map((allocation) => xbytes(Number(allocation.allocation))).join(', ') || '-';
    content.push(
      `|${addressId}| ${allocationWithPercentage[0] || '-'} | ${allocationWithPercentage[1] || '-'} | ${allocationWithPercentage[2] || '-'} | ${remainingAlloc} |`
    );
  });
  content.push('');
  return content.join('\n');
};
