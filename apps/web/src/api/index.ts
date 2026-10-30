import type { ApiClient } from "./client";
import { httpClient } from "./http";
import { mockClient } from "./mock";

export * from "./types";
export type { ApiClient, RealtimeConnection, RealtimeHandlers } from "./client";

// VITE_API_MOCK=1 selects the in-memory mock (no backend needed). Anything else uses the real api at /api.
export const useMockApi = import.meta.env.VITE_API_MOCK === "1";
export const api: ApiClient = useMockApi ? mockClient : httpClient;
