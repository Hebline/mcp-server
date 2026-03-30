# Hebline MCP Server

**Your agents overpay for every API call. We fix that.**

Hebline routes every API call — including LLM calls — to the best service at the right price. Free when it's enough. Paid when it matters. It knows the difference.

Every other router earns a margin on your paid calls. Routing you to free alternatives kills their revenue. **No margin on your API calls. Ever.**

## Why Hebline?

Your agents are bleeding money. One task triggers 5–10 paid API calls across different providers. No transparency, no cost control. Hebline fixes that:

- **Route free first** — Most calls don't need the best model. Hebline learns precisely when it matters — and keeps learning as the market changes.
- **No margin. Honest routing.** — We don't earn when you pay more. So we're the only router built to actually save you money.
- **Provider Abstraction** — Your agent says *what* it needs ("geocode this address"), not *which service* to use. Swap providers without changing agent code.
- **Cost Transparency** — Every call is logged with service used, latency, and cost. Know exactly what your agents spend.
- **Learns from usage** — Hebbian learning strengthens what works, weakens what doesn't. Your broker gets smarter every day.
- **BYOK (Bring Your Own Key)** — Paid services use your API keys via environment variables. No key? The service is automatically excluded from routing.
- **GDPR compliant** — Only anonymized metadata logged. No API call content stored. Self-hosted option for zero data leaving your network.
- **Open Source** — Core MCP server is MIT licensed. Community-driven adapter system.

## How It Works

```
Your AI Agent ←→ Hebline MCP Server ←→ Best API (Nominatim, DeepL, Google Maps, ...)
                        │
                   Smart Routing
                   Cost Logging
                   Provider Scoring
```

Your agent connects to Hebline as an MCP server. Instead of calling APIs directly, it uses Hebline's tools — `execute`, `compare`, or `categories`. Hebline scores all available services, picks the best one, makes the call, and returns the result with full metadata.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `execute` | Route to the best service and make the API call. Returns result + metadata (service, cost, latency). |
| `compare` | Show all available services for a capability with scores. See what's available before committing. |
| `categories` | List all supported capabilities and their services. |

## Quick Start

### Add to Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hebline": {
      "command": "npx",
      "args": ["-y", "-p", "@hebline.ai/mcp-server", "hebline-mcp"]
    }
  }
}
```

### Add to Claude Code

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "hebline": {
      "command": "hebline-mcp"
    }
  }
}
```

### Add to Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hebline": {
      "command": "npx",
      "args": ["-y", "-p", "@hebline.ai/mcp-server", "hebline-mcp"]
    }
  }
}
```

### Add to Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "hebline": {
      "command": "npx",
      "args": ["-y", "-p", "@hebline.ai/mcp-server", "hebline-mcp"]
    }
  }
}
```

### Add to VS Code (Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "hebline": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "-p", "@hebline.ai/mcp-server", "hebline-mcp"]
    }
  }
}
```

### Install globally

```bash
npm install -g @hebline.ai/mcp-server
```

### With paid services (optional)

Set environment variables for any paid providers you want to use:

```env
GOOGLE_MAPS_API_KEY=your-key-here
DEEPL_API_KEY=your-key-here
LIBRETRANSLATE_API_KEY=your-key-here
```

No keys? No problem — Hebline routes to free alternatives automatically.

## Supported Services

| Category | Free | Paid (BYOK) |
|----------|------|-------------|
| **LLMs** | Groq (Llama 3.3 70B), Google Gemini Flash | OpenAI GPT-4o-mini (`OPENAI_API_KEY`) |
| Geocoding | Nominatim (OpenStreetMap) | Google Maps (`GOOGLE_MAPS_API_KEY`) |
| Translation | MyMemory | DeepL (`DEEPL_API_KEY`), LibreTranslate (`LIBRETRANSLATE_API_KEY`) |
| Web Scraping | Fetch Scraper | Firecrawl (`FIRECRAWL_API_KEY`) |
| Currency | ExchangeRate-API | Fixer.io (`FIXER_API_KEY`) |
| OCR | OCR.space | Google Vision (`GOOGLE_VISION_API_KEY`) |
| Weather | Open-Meteo | OpenWeatherMap (`OPENWEATHERMAP_API_KEY`) |
| Web Search | DuckDuckGo | Brave Search (`BRAVE_API_KEY`) |
| News | HackerNews | NewsAPI.org (`NEWSAPI_KEY`) |

**9 categories, 20 services.** Free services work instantly — no API key needed. LLMs route through the Hebline proxy when no local key is set (50 free calls/day).

## Example

An agent asks: *"Geocode the Brandenburg Gate in Berlin"*

Hebline receives:
```json
{
  "capability": "geocoding",
  "input": { "query": "Brandenburger Tor, Berlin" },
  "constraint": "free"
}
```

Hebline responds:
```json
{
  "success": true,
  "data": {
    "lat": 52.5163,
    "lon": 13.3777,
    "displayName": "Brandenburger Tor, Pariser Platz, Berlin, 10117, Deutschland"
  },
  "meta": {
    "service": "Nominatim (OpenStreetMap)",
    "costUsd": 0,
    "latencyMs": 258,
    "score": 0.702,
    "free": true
  }
}
```

The agent got coordinates, knows it was free, and Hebline logged the call for future analysis.

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point (stdio transport)
│   ├── types.ts              # Shared TypeScript types
│   ├── registry.ts           # Service definitions (capabilities, costs, scores)
│   ├── router.ts             # Weighted scoring engine (Hopfield-ready)
│   ├── logger.ts             # Append-only JSONL call log (~/.hebline/calls.jsonl)
│   ├── adapters/             # One adapter per service
│   │   ├── nominatim.ts      # Free geocoding
│   │   ├── google-maps.ts    # Paid geocoding (BYOK)
│   │   ├── mymemory.ts       # Free translation
│   │   ├── libretranslate.ts # Paid translation (BYOK)
│   │   └── deepl.ts          # Paid translation (BYOK)
│   └── tools/                # MCP tool definitions
│       ├── execute.ts        # Route + call best service
│       ├── compare.ts        # Score all services
│       └── categories.ts     # List capabilities
```

## Call Logging

Every API call is logged to `~/.hebline/calls.jsonl`:

```json
{"timestamp":"2026-03-29T09:36:37Z","capability":"geocoding","serviceId":"nominatim","latencyMs":212,"success":true,"costUsd":0}
```

No content is logged — only metadata. This data will power Hebbian Learning in future versions.

## Roadmap

- [x] Core MCP server with stdio transport
- [x] Weighted scoring router
- [x] Geocoding adapters (Nominatim, Google Maps)
- [x] Translation adapters (MyMemory, LibreTranslate, DeepL)
- [x] BYOK key management
- [x] Append-only call logging
- [x] CI/CD with GitHub Actions
- [ ] Hebbian Learning — router learns from call history
- [ ] Hopfield network scoring (replaces weighted scoring)
- [ ] More categories (web scraping, currency, OCR, email)
- [ ] Community adapter system
- [ ] SSE transport for remote deployments
- [ ] Web dashboard for cost analytics
- [ ] Budget alerts and spending limits
- [ ] Multi-agent cost attribution

## Contributing

Contributions are welcome! Adding a new adapter is straightforward — implement the `ServiceAdapter` interface and register it.

```bash
git clone https://github.com/hebline/mcp-server.git
cd mcp-server
npm install
npm run build
npm test
```

## License

[MIT](LICENSE)

---

Built by [Hebline](https://hebline.ai) — Route free first. Only pay when necessary.
