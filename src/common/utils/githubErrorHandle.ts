import { Octokit } from '@octokit/rest';

import { logger } from '@/server';

import { env } from './envConfig';

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

export const githubErrorHandle = async (
  issueTittle: string,
  error: string,
  repoName: string,
  repoUsername: string,
  repoIssue: number
) => {
  try {
    await octokit.issues.createComment({
      owner: repoUsername,
      repo: repoName,
      issue_number: repoIssue,
      body: `## ${issueTittle}\n\n${error}`,
    });
  } catch (error) {
    logger.error(`Error creating issue on github: ${(error as Error).message}`);
  }
};
