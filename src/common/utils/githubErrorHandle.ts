import axios from 'axios';

import { logger } from '@/server';

import { env } from './envConfig';

export const githubErrorHandle = async (
  issueTittle: string,
  error: string,
  repoName: string,
  repoUsername: string,
  repoIssue: number
) => {
  try {
    await axios.post(
      `https://api.github.com/repos/${repoName}/${repoUsername}/issues/${repoIssue}/comments`,
      {
        body: `## ${issueTittle}

        ${error}`,
      },
      {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        },
      }
    );
  } catch (error) {
    logger.error(`Error creating issue on github: ${(error as Error).message}`);
  }
};
