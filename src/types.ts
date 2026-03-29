// ---------------------------------------------------------------------------
// Hebline MCP Server — Shared Types
// ---------------------------------------------------------------------------

/** A capability category that Hebline can route (geocoding, translation, …) */
export type Capability = string;

/** Cost constraint the agent can specify */
export type CostConstraint = "free" | "cheapest" | "any";

/** Unified request coming from the router */
export interface ServiceRequest {
  capability: Capability;
  input: Record<string, unknown>;
  constraint: CostConstraint;
  region?: string;
}

/** Unified response every adapter must return */
export interface ServiceResponse {
  success: boolean;
  data: unknown;
  error?: string;
}

/** Static metadata describing a service in the registry */
export interface ServiceDefinition {
  id: string;
  name: string;
  category: Capability;
  free: boolean;
  requiresKey: boolean;
  envKey?: string;              // e.g. "GOOGLE_MAPS_API_KEY"
  costPerCall: number;          // USD, 0 for free
  regions: string[];            // ["global"] or ["eu", "us", …]
  qualityScore: number;         // 0–1
  avgLatencyMs: number;
  successRate: number;          // 0–1
}

/** What the router returns after scoring */
export interface ScoredService {
  service: ServiceDefinition;
  score: number;
  breakdown: {
    quality: number;
    cost: number;
    latency: number;
    reliability: number;
  };
}

/** A single log entry written to calls.jsonl */
export interface CallLogEntry {
  timestamp: string;
  capability: Capability;
  serviceId: string;
  latencyMs: number;
  success: boolean;
  costUsd: number;
}

/** Interface every service adapter must implement */
export interface ServiceAdapter {
  readonly serviceId: string;
  execute(input: Record<string, unknown>): Promise<ServiceResponse>;
}
