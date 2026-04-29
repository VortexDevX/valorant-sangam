interface AdminFetchOptions extends RequestInit {
  token: string;
  onUnauthorized?: () => void;
}

interface AdminFetchResult<T> {
  data: T | null;
  error: string | null;
  unauthorized: boolean;
}

export async function adminFetch<T = unknown>(
  url: string,
  { token, onUnauthorized, ...options }: AdminFetchOptions,
): Promise<AdminFetchResult<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (response.status === 401) {
    onUnauthorized?.();
    return {
      data: null,
      error: "Your session has expired. Please log in again.",
      unauthorized: true,
    };
  }

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    return {
      data: null,
      error: (payload as { error?: string }).error ?? "Request failed.",
      unauthorized: false,
    };
  }

  return { data: payload, error: null, unauthorized: false };
}
