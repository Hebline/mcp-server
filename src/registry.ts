// ---------------------------------------------------------------------------
// Service Registry — all available services and their metadata
// ---------------------------------------------------------------------------

import type { ServiceDefinition } from "./types.js";

export const services: ServiceDefinition[] = [
  // ── Geocoding ───────────────────────────────────────────────────────
  {
    id: "nominatim",
    name: "Nominatim (OpenStreetMap)",
    category: "geocoding",
    free: true,
    requiresKey: false,
    costPerCall: 0,
    regions: ["global"],
    qualityScore: 0.75,
    avgLatencyMs: 400,
    successRate: 0.95,
  },
  {
    id: "google-maps",
    name: "Google Maps Geocoding",
    category: "geocoding",
    free: false,
    requiresKey: true,
    envKey: "GOOGLE_MAPS_API_KEY",
    costPerCall: 0.005,
    regions: ["global"],
    qualityScore: 0.98,
    avgLatencyMs: 120,
    successRate: 0.995,
  },

  // ── Translation ─────────────────────────────────────────────────────
  {
    id: "mymemory",
    name: "MyMemory",
    category: "translation",
    free: true,
    requiresKey: false,
    costPerCall: 0,
    regions: ["global"],
    qualityScore: 0.72,
    avgLatencyMs: 300,
    successRate: 0.95,
  },
  {
    id: "libretranslate",
    name: "LibreTranslate",
    category: "translation",
    free: false,
    requiresKey: true,
    envKey: "LIBRETRANSLATE_API_KEY",
    costPerCall: 0.00001,
    regions: ["global"],
    qualityScore: 0.70,
    avgLatencyMs: 600,
    successRate: 0.92,
  },
  {
    id: "deepl",
    name: "DeepL",
    category: "translation",
    free: false,
    requiresKey: true,
    envKey: "DEEPL_API_KEY",
    costPerCall: 0.00002, // ~$20 per 1M chars → ~$0.00002 per short call
    regions: ["global"],
    qualityScore: 0.96,
    avgLatencyMs: 200,
    successRate: 0.99,
  },
];

/** Look up a single service by ID */
export function getService(id: string): ServiceDefinition | undefined {
  return services.find((s) => s.id === id);
}

/** Get all services for a given capability */
export function getServicesByCategory(category: string): ServiceDefinition[] {
  return services.filter((s) => s.category === category);
}

/** Get all unique categories */
export function getCategories(): string[] {
  return [...new Set(services.map((s) => s.category))];
}
