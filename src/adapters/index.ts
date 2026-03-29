// ---------------------------------------------------------------------------
// Adapter Registry — maps service IDs to their adapter instances
// ---------------------------------------------------------------------------

import type { ServiceAdapter } from "../types.js";
import { NominatimAdapter } from "./nominatim.js";
import { GoogleMapsAdapter } from "./google-maps.js";
import { MyMemoryAdapter } from "./mymemory.js";
import { LibreTranslateAdapter } from "./libretranslate.js";
import { DeepLAdapter } from "./deepl.js";

const adapters = new Map<string, ServiceAdapter>();

function register(adapter: ServiceAdapter): void {
  adapters.set(adapter.serviceId, adapter);
}

// Register all built-in adapters
register(new NominatimAdapter());
register(new GoogleMapsAdapter());
register(new MyMemoryAdapter());
register(new LibreTranslateAdapter());
register(new DeepLAdapter());

export function getAdapter(serviceId: string): ServiceAdapter | undefined {
  return adapters.get(serviceId);
}

export function hasAdapter(serviceId: string): boolean {
  return adapters.has(serviceId);
}
