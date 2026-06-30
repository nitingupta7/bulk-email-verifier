export type EmailSyntaxValidationErrorCode =
  | "EMPTY_EMAIL"
  | "EMAIL_TOO_LONG"
  | "LOCAL_PART_TOO_LONG"
  | "MISSING_AT_SYMBOL"
  | "MULTIPLE_AT_SYMBOLS"
  | "INVALID_LOCAL_PART"
  | "INVALID_DOMAIN"
  | "INVALID_FORMAT";

export type EmailSyntaxValidationResult = {
  email: string;
  isValid: boolean;
  normalizedEmail: string | null;
  errorCode: EmailSyntaxValidationErrorCode | null;
  reason: string | null;
};

export type BulkEmailSyntaxValidationResult = {
  total: number;
  valid: number;
  invalid: number;
  results: EmailSyntaxValidationResult[];
};
