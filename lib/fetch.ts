import { AppException } from "./errors";

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeout = 10_000, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });

    if (!response.ok) {
      if (response.status === 401)
        throw new AppException("UNAUTHORIZED", "Please sign in.");
      if (response.status === 403)
        throw new AppException("FORBIDDEN", "Access denied.");
      if (response.status === 404)
        throw new AppException("NOT_FOUND", "Resource not found.");
      if (response.status >= 500)
        throw new AppException(
          "EXTERNAL_SERVICE_ERROR",
          "The server encountered an error. Please try again.",
        );
      throw new AppException("INTERNAL_ERROR", "An unexpected error occurred.");
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof AppException) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AppException(
        "NETWORK_ERROR",
        "The request timed out. Check your connection.",
      );
    }

    throw new AppException(
      "NETWORK_ERROR",
      "Network error. Check your connection and try again.",
      { cause: err },
    );
  } finally {
    clearTimeout(timer);
  }
}
