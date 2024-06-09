import axios from 'axios';

import { ResponseStatus, ServiceResponse } from '../models/serviceResponse';

export const getApiKey = async (): Promise<string> => {
  try {
    const { data: apiKey } = await axios.get('http://api.datacapstats.io/public/api/getApiKey');

    return apiKey;
  } catch (error) {
    throw new ServiceResponse(ResponseStatus.Failed, 'Failed to get API key', null, 500);
  }
};
