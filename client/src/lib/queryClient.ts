import { QueryClient, QueryFunction } from "@tanstack/react-query";

let csrfToken = "";

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  console.log('Fetching new CSRF token');
  const response = await fetch('/api/csrf-token');
  const data = await response.json() as { csrfToken: string };
  console.log('Received CSRF token:', data.csrfToken ? '✓' : '✗');
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error('API Error:', {
      status: res.status,
      statusText: res.statusText,
      body: text
    });
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {};
  console.log(`API Request: ${method} ${url}`, {
    hasData: !!data,
    timestamp: new Date().toISOString()
  });

  // Add content type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for unsafe methods
  if (method !== 'GET' && method !== 'HEAD') {
    const token = await getCsrfToken();
    headers['CSRF-Token'] = token;
    console.log('Added CSRF token to request headers');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`API Response: ${method} ${url}`, {
    status: res.status,
    ok: res.ok,
    timestamp: new Date().toISOString()
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
    console.log('Query execution:', {
      key: queryKey[0],
      timestamp: new Date().toISOString()
    });

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Returning null due to 401 response');
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