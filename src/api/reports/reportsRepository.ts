import { listReportsQuery } from '@/common/utils/dbQuery';
import { db } from '@/db';

import { Report } from './reportsModel';

export const reportsRepository = {
  getReports: async (): Promise<Report[]> => {
    const { rows } = await db.query(listReportsQuery);
    return rows;
  },
};
