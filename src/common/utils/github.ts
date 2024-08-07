export const getInfoFromGithubIssueUrl = (url: string) => {
  const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/;
  const match = url?.match(regex);

  if (!match) {
    return null;
  }

  const owner = match[1];
  const repoName = match[2];
  const issueNumber = match[3];
  return { owner, repoName, issueNumber };
};
