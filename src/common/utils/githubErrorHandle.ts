import { logger } from '@/server';

import createComment from './createGhComment';

export const githubErrorHandle = async (
  issueTittle: string,
  error: string,
  repoName: string,
  repoUsername: string,
  repoIssue: number
) => {
  try {
    await createComment(repoUsername, repoName, repoIssue, `## ${issueTittle}\n\n${error}`);
  } catch (error) {
    logger.error(`Error creating issue on github: ${(error as Error).message}`);
  }
};
