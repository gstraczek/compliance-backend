import { Webhooks } from '@octokit/webhooks';

import { reportService } from '@/api/report/reportService';
import { logger } from '@/server';

import createComment from '../utils/createGhComment';
import { env } from '../utils/envConfig';

const webhooks = new Webhooks({
  secret: env.WEBHOOK_SECRET,
});

webhooks.on(['issue_comment.created', 'issue_comment.edited'], async (context) => {
  try {
    if (context.payload.comment.body.includes(env.REPORT_TRIGGER_KEYWORD)) {
      const issue = context.payload.issue.body;

      if (issue?.includes('Organization On-chain Identity')) {
        // const allocatorAddress = getAddressFromIssue(issue);
        const allocatorAddress = 'f2arpo76vxmneuor5qunbpybm24k7efomlev3rk5i';

        if (allocatorAddress) {
          const owner = context.payload.repository.owner.login;
          const repo = context.payload.repository.name;
          const issue_number = context.payload.issue.number;

          const report = await reportService.generateReport(allocatorAddress);
          if (!report.success) {
            await createComment(owner, repo, issue_number, `## Error\n\n${report.message}`);
            return;
          }

          await createComment(owner, repo, issue_number, report.responseObject);
        }
      }
    }
  } catch (error) {
    logger.error(`Error in webhooks: ${(error as Error).message}`);
  }
});

export default webhooks;
