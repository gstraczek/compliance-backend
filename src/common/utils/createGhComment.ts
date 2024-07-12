import { env } from './envConfig';

const initializeOctokit = async (owner: string, repo: string) => {
  const { Octokit } = await import('@octokit/rest');
  const { createAppAuth } = await import("@octokit/auth-app");

  let octokit  = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.APP_ID,
      privateKey: env.GH_PRIVATE_KEY,
    },
  });
  const { data: installation } = await octokit.apps.getRepoInstallation({owner, repo})
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.APP_ID,
      privateKey: env.GH_PRIVATE_KEY,
      installationId: installation.id,
    }
  });
};

const createComment = async (owner: string, repo: string, issue_number: number, body: string) => {
  const octokit = await initializeOctokit(owner, repo);
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
};

export default createComment;
