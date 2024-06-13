import { GrantedDatacapByVerifier } from './reportModel';

export const reportUtils = {
  getSortedClientsByDate: (grantedDatacapByVerifier: GrantedDatacapByVerifier[]) => {
    const grouped = grantedDatacapByVerifier.reduce((map, row) => {
      if (!map.has(row.addressId)) {
        map.set(row.addressId, []);
      }
      map.get(row.addressId).push(row);
      return map;
    }, new Map());

    grouped.forEach((rows) => {
      rows.sort((a, b) => a.allocationTimestamp - b.allocationTimestamp);
    });

    return Array.from(grouped.values()).flat();
  },
};
