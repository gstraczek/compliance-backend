import { Octokit } from '@octokit/rest';

import { env } from './envConfig';

const createComment = async (owner: string, repo: string, issue_number: number, body: string) => {
  const octokit = new Octokit({
    auth: env.GITHUB_TOKEN,
  });

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
};

export default createComment;
