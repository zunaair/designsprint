const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string | null | undefined;
}

/** Centralised API client with auth headers */
async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.message ?? body.error ?? `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  createScan: (data: { url: string; email: string; viewport: string }, token?: string | null) =>
    apiFetch<{ id: string }>('/scans', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getScan: (id: string, token?: string | null) =>
    apiFetch<Record<string, unknown>>(`/scans/${id}`, { token }),

  listScans: (page = 1, limit = 20, token?: string | null) =>
    apiFetch<{ scans: Record<string, unknown>[]; total: number }>(`/scans?page=${page}&limit=${limit}`, { token }),

  getProfile: (token: string) =>
    apiFetch<{ id: string; email: string; tier: string; createdAt: string }>('/user/me', { token }),

  createCheckout: (plan: string, token: string) =>
    apiFetch<{ checkoutUrl: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
      token,
    }),
};
