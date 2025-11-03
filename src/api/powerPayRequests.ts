// PowerPay API Request Module
import type {
  UUID,
  SaveReportRequest,
  ReportResponse,
  ConversationRequest,
  ConversationResponse,
  ReportDataResponse,
  PowerPayHttpError
} from '@/interfaces/PowerPayApi.interface';

// Base configuration
const POWERPAY_BASE_URL = import.meta.env.VITE_POWERPAY_API_URL || 
  'https://ppcustomreport-crg4b5g5gccfgmhn.canadacentral-01.azurewebsites.net';
const POWERPAY_TOKEN = import.meta.env.VITE_POWERPAY_BEARER_TOKEN;

// Simple fetch wrapper with auth and error handling
async function powerPayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${POWERPAY_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };

  if (POWERPAY_TOKEN) {
    headers.Authorization = `Bearer ${POWERPAY_TOKEN}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.clone().json();
    } catch {
      try {
        details = await response.text();
      } catch {
        details = null;
      }
    }
    const error = new Error(`${response.status} ${response.statusText}`) as PowerPayHttpError;
    error.name = "PowerPayHttpError";
    error.status = response.status;
    error.details = details;
    throw error;
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) return undefined as unknown as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * GET /reports
 * Fetch all reports for the current user
 */
export async function getReports(signal?: AbortSignal): Promise<ReportResponse[]> {
  return powerPayFetch<ReportResponse[]>('/reports', { signal });
}

/**
 * POST /reports
 * Save or update a report
 */
export async function saveReport(
  payload: SaveReportRequest,
  signal?: AbortSignal
): Promise<ReportResponse> {
  return powerPayFetch<ReportResponse>('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
}

/**
 * POST /conversations/start
 * Start a new conversation with a prompt
 */
export async function startConversation(
  payload: ConversationRequest,
  signal?: AbortSignal
): Promise<ConversationResponse> {
  return powerPayFetch<ConversationResponse>('/conversations/start', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
}

/**
 * POST /conversations/{reportId}/continue
 * Continue an existing conversation
 */
export async function continueConversation(
  reportId: UUID,
  payload: ConversationRequest,
  signal?: AbortSignal
): Promise<ConversationResponse> {
  return powerPayFetch<ConversationResponse>(`/conversations/${reportId}/continue`, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
}

/**
 * GET /conversations/{reportId}/messages
 * Get all messages for a conversation
 */
export async function getConversationMessages(
  reportId: UUID,
  signal?: AbortSignal
): Promise<ConversationResponse> {
  return powerPayFetch<ConversationResponse>(`/conversations/${reportId}/messages`, { signal });
}

/**
 * GET /conversations/{reportId}/messages/{messageId}/data
 * Get report data for a specific message
 */
export async function getReportData(
  reportId: UUID,
  messageId: UUID,
  signal?: AbortSignal
): Promise<ReportDataResponse> {
  return powerPayFetch<ReportDataResponse>(
    `/conversations/${reportId}/messages/${messageId}/data`,
    { signal }
  );
}
