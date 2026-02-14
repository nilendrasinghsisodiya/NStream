import { Router } from 'express';
import { healthcheck } from '../controllers/healthcheck.controller.js';

const hcRouter = Router();

hcRouter.get('/health', healthcheck);
export { hcRouter };
