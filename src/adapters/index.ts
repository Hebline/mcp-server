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
import { ExchangeRateAdapter } from "./exchangerate.js";
import { FixerAdapter } from "./fixer.js";
import { OcrSpaceAdapter } from "./ocr-space.js";
import { GoogleVisionAdapter } from "./google-vision.js";
import { OpenMeteoAdapter } from "./open-meteo.js";
import { OpenWeatherMapAdapter } from "./openweathermap.js";
import { DuckDuckGoAdapter } from "./duckduckgo.js";
import { BraveSearchAdapter } from "./brave-search.js";
import { HackerNewsAdapter } from "./hackernews.js";
import { NewsApiAdapter } from "./newsapi.js";

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
register(new ExchangeRateAdapter());
register(new FixerAdapter());
register(new OcrSpaceAdapter());
register(new GoogleVisionAdapter());
register(new OpenMeteoAdapter());
register(new OpenWeatherMapAdapter());
register(new DuckDuckGoAdapter());
register(new BraveSearchAdapter());
register(new HackerNewsAdapter());
register(new NewsApiAdapter());

export function getAdapter(serviceId: string): ServiceAdapter | undefined {
  return adapters.get(serviceId);
}

export function hasAdapter(serviceId: string): boolean {
  return adapters.has(serviceId);
}
