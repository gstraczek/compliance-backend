export function getAddressFromIssue(issueContent: string) {
  const trimmed = issueContent.replace(/(\n)|(\r)/gm, '');
  const addressRegex = /(f[1-4][a-z0-9]+)/i;
  const address = trimmed.match(addressRegex);
  return address ? address[0] : null;
}

export function getAddressFromComment(commentBody: string, keyword: string) {
  const addressRegex = new RegExp(`^${keyword} (f[1-4][a-z0-9]+)$`, 'i');
  const match = commentBody.match(addressRegex);
  return match ? match[1] : null;
}
