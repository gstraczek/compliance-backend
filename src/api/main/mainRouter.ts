import express, { Request, Response, Router } from 'express';

export const MainRouter: Router = (() => {
  const router = express.Router();

  router.get('/', async (_req: Request, res: Response) => {
    res.send(`
      <h1>Welcome to the Compliance Report Service</h1>
    <p>To run compliance report trigger the verifier from the  <a href="https://github.com/filecoin-project/Allocator-Governance/issues">github repo</a></p>`);
  });

  return router;
})();
