import { env } from './envConfig';

let octokit: any;

const initializeOctokit = async () => {
  const { Octokit } = await import('@octokit/rest');
  octokit = new Octokit({
    auth: env.GITHUB_TOKEN,
  });
};

const createComment = async (owner: string, repo: string, issue_number: number, body: string) => {
  if (!octokit) {
    await initializeOctokit();
  }
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
};

export default createComment;
