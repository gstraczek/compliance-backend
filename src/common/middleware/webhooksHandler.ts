import { Webhooks } from '@octokit/webhooks';

import { reportService } from '@/api/report/reportService';
import { logger } from '@/server';

import createComment from '../utils/createGhComment';
import { env } from '../utils/envConfig';
import { getAddressFromComment } from '../utils/getAddressFromIssue';

const webhooks = new Webhooks({
  secret: env.WEBHOOK_SECRET,
});

webhooks.on(['issue_comment.created', 'issue_comment.edited'], async (context) => {
  try {
    const commentBody = context.payload.comment.body;
    if (!commentBody.includes(env.REPORT_TRIGGER_KEYWORD)) return;

    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const issue_number = context.payload.issue.number;
    const allocatorAddress = getAddressFromComment(commentBody, env.REPORT_TRIGGER_KEYWORD);
    if (allocatorAddress) {
      await createComment(
        owner,
        repo,
        issue_number,
        "Received request to generate a report. Please wait a few minutes while it's being generated."
      );
      const report = await reportService.generateReport(allocatorAddress);
      if (!report.success) {
        await createComment(owner, repo, issue_number, `## Error\n\n${report.message}`);
        return;
      }

      await createComment(owner, repo, issue_number, report.responseObject);
    } else {
      await createComment(
        owner,
        repo,
        issue_number,
        `## Error\n\nInvalid validator address provided. Address must be separated by a space after the trigger keyword.`
      );
    }
  } catch (error) {
    logger.error(`Error in webhooks: ${(error as Error).message}`);
  }
});

export default webhooks;
