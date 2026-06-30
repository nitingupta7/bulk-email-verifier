import { createServer } from "node:http";

import { app } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const server = createServer(app);

server.listen(config.port, config.host, () => {
  logger.info(`Backend server listening on http://${config.host}:${config.port}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info(`${signal} received. Shutting down backend server.`);
  server.close((error?: Error) => {
    if (error) {
      logger.error("Error while shutting down server", { error });
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
