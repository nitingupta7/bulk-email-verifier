import cors from "cors";
import helmet from "helmet";

import { config } from "../config/index.js";

export const securityMiddleware = [
  helmet(),
  cors({
    origin: config.corsOrigins === "*" ? true : config.corsOrigins
  })
];
