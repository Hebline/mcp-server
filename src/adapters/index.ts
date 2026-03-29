// ---------------------------------------------------------------------------
// Adapter Registry — maps service IDs to their adapter instances
// ---------------------------------------------------------------------------

import type { ServiceAdapter } from "../types.js";
import { NominatimAdapter } from "./nominatim.js";
import { GoogleMapsAdapter } from "./google-maps.js";
import { MyMemoryAdapter } from "./mymemory.js";
import { LibreTranslateAdapter } from "./libretranslate.js";
import { DeepLAdapter } from "./deepl.js";
import { FetchScraperAdapter } from "./fetch-scraper.js";
import { FirecrawlAdapter } from "./firecrawl.js";

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
register(new FetchScraperAdapter());
register(new FirecrawlAdapter());

export function getAdapter(serviceId: string): ServiceAdapter | undefined {
  return adapters.get(serviceId);
}

export function hasAdapter(serviceId: string): boolean {
  return adapters.has(serviceId);
}
