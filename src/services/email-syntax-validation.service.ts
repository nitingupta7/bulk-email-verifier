import type {
  BulkEmailSyntaxValidationResult,
  EmailSyntaxValidationErrorCode,
  EmailSyntaxValidationResult
} from "../types/email-syntax-validation.js";

const maxEmailLength = 254;
const maxLocalPartLength = 64;
const localPartPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const domainPattern =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const emailPattern = new RegExp(`^${localPartPattern.source.slice(1, -1)}@${domainPattern.source.slice(1, -1)}$`);

export const validateEmailSyntax = (email: string): EmailSyntaxValidationResult => {
  const originalEmail = email;
  const normalizedCandidate = email.trim();

  if (!normalizedCandidate) {
    return invalid(originalEmail, "EMPTY_EMAIL", "Email address is empty");
  }

  if (normalizedCandidate.length > maxEmailLength) {
    return invalid(originalEmail, "EMAIL_TOO_LONG", "Email address exceeds 254 characters");
  }

  const atSymbolCount = countOccurrences(normalizedCandidate, "@");

  if (atSymbolCount === 0) {
    return invalid(originalEmail, "MISSING_AT_SYMBOL", "Email address must contain one @ symbol");
  }

  if (atSymbolCount > 1) {
    return invalid(originalEmail, "MULTIPLE_AT_SYMBOLS", "Email address must contain only one @ symbol");
  }

  const [localPart, domainPart] = normalizedCandidate.split("@") as [string, string];

  if (localPart.length > maxLocalPartLength) {
    return invalid(originalEmail, "LOCAL_PART_TOO_LONG", "Local part exceeds 64 characters");
  }

  if (!localPartPattern.test(localPart)) {
    return invalid(originalEmail, "INVALID_LOCAL_PART", "Local part is not in a valid email format");
  }

  if (!domainPattern.test(domainPart)) {
    return invalid(originalEmail, "INVALID_DOMAIN", "Domain is not in a valid email format");
  }

  const normalizedEmail = `${localPart}@${domainPart.toLowerCase()}`;

  if (!emailPattern.test(normalizedEmail)) {
    return invalid(originalEmail, "INVALID_FORMAT", "Email address is not in a valid format");
  }

  return {
    email: originalEmail,
    isValid: true,
    normalizedEmail,
    errorCode: null,
    reason: null
  };
};

export const validateEmailSyntaxBulk = (emails: string[]): BulkEmailSyntaxValidationResult => {
  const results = emails.map(validateEmailSyntax);
  const valid = results.filter((result) => result.isValid).length;

  return {
    total: results.length,
    valid,
    invalid: results.length - valid,
    results
  };
};

const invalid = (
  email: string,
  errorCode: EmailSyntaxValidationErrorCode,
  reason: string
): EmailSyntaxValidationResult => {
  return {
    email,
    isValid: false,
    normalizedEmail: null,
    errorCode,
    reason
  };
};

const countOccurrences = (value: string, searchValue: string): number => {
  return value.split(searchValue).length - 1;
};
