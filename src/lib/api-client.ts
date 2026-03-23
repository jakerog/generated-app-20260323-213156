import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const contentType = res.headers.get('content-type');
  let json: ApiResponse<T> | null = null;
  if (contentType && contentType.includes('application/json')) {
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch (e) {
      const error = new Error(`Failed to parse JSON response from ${path}`);
      (error as any).status = res.status;
      throw error;
    }
  }
  if (!res.ok || !json || !json.success || json.data === undefined) {
    const error = new Error(json?.error || `Request failed with status ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
  return json.data
}