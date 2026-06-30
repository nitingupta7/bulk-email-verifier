import { Router } from "express";

import { healthRouter } from "./health.routes.js";
import { verificationRouter } from "./verification.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/verification", verificationRouter);
