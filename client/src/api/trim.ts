const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export interface ApiErrorBody {
  error: string;
  code: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface UrlResponse {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
}

export interface UrlWithClicks {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias: string | null;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
}

export interface ClicksPerDay {
  date: string;
  clicks: number;
}

export interface ReferrerBreakdown {
  referrer: string;
  clicks: number;
}

export interface AnalyticsResponse {
  shortCode: string;
  originalUrl?: string;
  totalClicks: number;
  clicksPerDay: ClicksPerDay[];
  byReferrer: ReferrerBreakdown[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = response.statusText;
  let code = "UNKNOWN_ERROR";

  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.error) message = body.error;
    if (body.code) code = body.code;
  } catch {
    // Response body was not JSON.
  }

  throw new ApiError(message, code, response.status);
}

export async function createShortUrl(
  originalUrl: string,
  customAlias?: string,
): Promise<UrlResponse> {
  return request<UrlResponse>("/api/urls", {
    method: "POST",
    body: JSON.stringify({
      originalUrl,
      ...(customAlias ? { customAlias } : {}),
    }),
  });
}

export async function getAllUrls(): Promise<UrlWithClicks[]> {
  return request<UrlWithClicks[]>("/api/urls");
}

export async function getAnalytics(code: string): Promise<AnalyticsResponse> {
  return request<AnalyticsResponse>(
    `/api/urls/${encodeURIComponent(code)}/analytics`,
  );
}
