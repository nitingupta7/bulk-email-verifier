type LogContext = Record<string, unknown>;

const serializeContext = (context?: LogContext): string => {
  if (!context || Object.keys(context).length === 0) {
    return "";
  }

  return ` ${JSON.stringify(context)}`;
};

const write = (level: "info" | "warn" | "error", message: string, context?: LogContext): void => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${serializeContext(context)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  info: (message: string, context?: LogContext): void => write("info", message, context),
  warn: (message: string, context?: LogContext): void => write("warn", message, context),
  error: (message: string, context?: LogContext): void => write("error", message, context)
};
