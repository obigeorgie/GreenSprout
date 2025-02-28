import { QueryClient, QueryFunction } from "@tanstack/react-query";

let csrfToken = "";

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  const response = await fetch('/api/csrf-token');
  const data = await response.json() as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {};

  // Add content type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for unsafe methods
  if (method !== 'GET' && method !== 'HEAD') {
    const token = await getCsrfToken();
    headers['CSRF-Token'] = token;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});