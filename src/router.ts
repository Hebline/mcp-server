// ---------------------------------------------------------------------------
// Router — finds the best service for a request
// ---------------------------------------------------------------------------
// Phase 1: rule-based weighted scoring.
// The `score()` function is isolated so it can be swapped for Hopfield later.
// ---------------------------------------------------------------------------

import type {
  ServiceDefinition,
  ServiceRequest,
  ScoredService,
  CostConstraint,
} from "./types.js";
import { getServicesByCategory } from "./registry.js";

// ── Scoring weights (sum = 1) ─────────────────────────────────────────────
const WEIGHTS = {
  quality: 0.35,
  cost: 0.25,
  latency: 0.20,
  reliability: 0.20,
};

/** Check if a paid service has its API key available */
function hasKey(service: ServiceDefinition): boolean {
  if (!service.requiresKey) return true;
  if (!service.envKey) return false;
  return !!process.env[service.envKey];
}

/** Filter services based on request constraints */
function filterCandidates(
  services: ServiceDefinition[],
  constraint: CostConstraint,
  region?: string,
): ServiceDefinition[] {
  return services.filter((s) => {
    // Key check — exclude paid services without a key
    if (!hasKey(s)) return false;

    // Cost constraint
    if (constraint === "free" && !s.free) return false;

    // Region filter
    if (region && !s.regions.includes("global") && !s.regions.includes(region)) {
      return false;
    }

    return true;
  });
}

/**
 * Score a single service. Each dimension is normalized to 0–1.
 * This function is the seam where Hopfield will plug in later.
 */
function score(
  service: ServiceDefinition,
  allCandidates: ServiceDefinition[],
): ScoredService {
  // Normalize cost: cheapest = 1, most expensive = 0
  const maxCost = Math.max(...allCandidates.map((s) => s.costPerCall), 0.001);
  const costScore = 1 - service.costPerCall / maxCost;

  // Normalize latency: fastest = 1, slowest = 0
  const maxLatency = Math.max(...allCandidates.map((s) => s.avgLatencyMs), 1);
  const latencyScore = 1 - service.avgLatencyMs / maxLatency;

  const breakdown = {
    quality: service.qualityScore,
    cost: costScore,
    latency: latencyScore,
    reliability: service.successRate,
  };

  const total =
    breakdown.quality * WEIGHTS.quality +
    breakdown.cost * WEIGHTS.cost +
    breakdown.latency * WEIGHTS.latency +
    breakdown.reliability * WEIGHTS.reliability;

  return { service, score: Math.round(total * 1000) / 1000, breakdown };
}

/** Route a request → return scored candidates, best first */
export function route(request: ServiceRequest): ScoredService[] {
  const candidates = filterCandidates(
    getServicesByCategory(request.capability),
    request.constraint,
    request.region,
  );

  if (candidates.length === 0) return [];

  const scored = candidates.map((s) => score(s, candidates));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/** Convenience: get the single best service */
export function routeBest(request: ServiceRequest): ScoredService | null {
  const results = route(request);
  return results[0] ?? null;
}
