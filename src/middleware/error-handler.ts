import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import multer from "multer";

import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  void _next;

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    response.status(statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  logger.error("Unhandled request error", { error });

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred"
    }
  });
};
