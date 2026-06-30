export type SupportedUploadExtension = "csv" | "txt";

export type UploadedEmailFile = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

export type ParsedEmailUpload = {
  fileName: string;
  fileType: SupportedUploadExtension;
  emails: string[];
};
