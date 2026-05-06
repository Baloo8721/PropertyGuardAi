# Property Guard Dashboard

A private, AI-powered home security system with 9-camera coverage, real-time detection, LLM-powered chat interface, and mobile-first tactical dashboard.

## Features

- **⌂ Home** — Daily summary, active alerts, camera grid, WiFi CSI presence
- **◉ Cams** — All 9 cameras with fullscreen view, 3DGS viewer, drone panel
- **≡ Events** — Full event log with filters (people/vehicles/animals/alerts)
- **◈ Intel** — Wildlife tracker, LPR vehicle log, system health, WiFi zones
- **◆ Guard** — AI chat powered by local LLM ("Ask anything about your property")

## Tech Stack

- **Frontend**: React + Vite (mobile-first 480px design)
- **NVR/AI**: Frigate with YOLO object detection
- **Automation**: Home Assistant
- **LLM**: Ollama (local) with custom Guard agent
- **Backend**: Docker, MQTT

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## Deployment

Push to `main` branch — GitHub Actions will auto-deploy to GitHub Pages.

## Hardware

- 9x PoE IP cameras (Amcrest/ANNKE 4K/5MP)
- Intel N100 mini PC (server)
- 16-port PoE switch
- Optional: ESP32 WiFi CSI sensors

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for contractor installation instructions.

## License

MIT — Private, self-hosted, no cloud dependencies.