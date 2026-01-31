export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type FetchJsonOptions = RequestInit & {
  params?: QueryParams;
};

function buildUrl(path: string, params?: QueryParams) {
  if (!params) {
    return path;
  }

  const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(path, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function parseApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || "Spróbuj ponownie.";
  } catch {
    return "Spróbuj ponownie.";
  }
}

export async function fetchJson<T>(path: string, options: FetchJsonOptions = {}) {
  const { params, ...init } = options;
  const url = buildUrl(path, params);
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await parseApiError(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
