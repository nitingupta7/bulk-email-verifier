import axios, { AxiosError } from "axios";

import type { UploadResponse, VerificationJobSnapshot } from "../types/api";

const configuredApiBaseUrl =
  typeof process !== "undefined" && process.env.API_BASE_URL ? process.env.API_BASE_URL : "";

export const apiBaseUrl =
  configuredApiBaseUrl || (window.location.port === "1234" ? "http://127.0.0.1:8000" : "");

const apiClient = axios.create({
  baseURL: apiBaseUrl
});

export const uploadEmailFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post<UploadResponse>("/api/verification/uploads", formData);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Upload failed."));
  }
};

export const createVerificationJob = async (file: File, concurrency?: number): Promise<VerificationJobSnapshot> => {
  const formData = new FormData();
  formData.append("file", file);

  if (concurrency) {
    formData.append("concurrency", String(concurrency));
  }

  try {
    const response = await apiClient.post<VerificationJobSnapshot>("/api/verification/jobs", formData);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not start verification job."));
  }
};

export const getVerificationJob = async (jobId: string): Promise<VerificationJobSnapshot> => {
  try {
    const response = await apiClient.get<VerificationJobSnapshot>(`/api/verification/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not load verification progress."));
  }
};

export const downloadVerificationCsv = async (jobId: string): Promise<void> => {
  try {
    const response = await apiClient.get<Blob>(`/api/verification/jobs/${jobId}/results.csv`, {
      responseType: "blob"
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "verification-results.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not download verification CSV."));
  }
};

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.message ?? fallback;
};
