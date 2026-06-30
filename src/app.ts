import { existsSync } from "node:fs";
import path from "node:path";

import express, { type Express } from "express";

import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { securityMiddleware } from "./middleware/security.js";
import { apiRouter } from "./routes/index.js";

export const app: Express = express();

app.disable("x-powered-by");
app.disable("etag");

app.use(securityMiddleware);
app.use(express.json({ limit: config.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit }));
app.use(requestLogger);

app.use("/api", apiRouter);

const frontendDistPath = path.resolve(process.cwd(), "dist-frontend");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_request, response) => {
    response.sendFile(frontendIndexPath);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
