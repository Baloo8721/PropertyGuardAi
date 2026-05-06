# Property Guard System — Build Guide for Contractors

## Quick Summary
This is a private, AI-powered security system using 9 PoE cameras, local processing, and no cloud services. Everything runs on-site.

---

## What You Need to Install

### 1. Networking
| Item | What It Does | Where to Buy |
|------|-------------|--------------|
| **PoE Switch** (16-port, 180W+) | Powers cameras through Ethernet | Amazon/TP-Link ~$100 |
| **Cat6 Ethernet Cables** | Camera connectivity | Amazon (bulk) ~$0.50/ft |
| **Router** (existing or new) | Network backbone | Any gigabit router |

### 2. Cameras (9x)
| Camera | Where | Est. Cost |
|--------|-------|-----------|
| Amcrest IP5M-T1277EW-AI (5MP) | Amazon | ~$70 each |
| **OR** ANNKE 4K PoE | Amazon | ~$60 each |

**Placement Strategy:**
- 4 corners (perimeter)
- 2 driveway/garage
- 2 backyard/side
- 1 wildlife/close-up

**Total Camera Cost:** ~$500-700

### 3. Server (The Brain)
| Spec | Why | Cost |
|------|-----|------|
| Intel N100 mini PC (16GB RAM, 512GB NVMe) | Handles 9 cameras + AI detection | $150-250 |
| 4-8TB HDD for recordings | Motion-only storage | $80-150 |

### 4. WiFi CSI Sensing (Optional)
- 3-5x ESP32-S3 boards (~$10 each)
- Tracks movement through walls
- Total: ~$30-50

---

## Software You'll Install (All Free/Open-Source)

1. **Frigate NVR** — Video recording + AI object detection
2. **Home Assistant** — Automation + dashboard
3. **Ollama** — Local AI/LLM for the "Guard" chat
4. **Docker** — Runs everything (easy setup)

---

## Step-by-Step Install

### Day 1: Network & Hardware
1. Mount cameras at planned locations
2. Run Cat6 cables to each camera
3. Connect cameras to PoE switch
4. Connect server to switch
5. Test camera streams (RTSP)

### Day 2: Server Setup
1. Install Ubuntu on N100 mini PC
2. Install Docker
3. Run: `docker-compose up -d` (we provide the config)
4. Add cameras to Frigate config
5. Set up detection zones

### Day 3: AI & Integration
1. Configure Frigate object detection (person/vehicle/animal)
2. Set up LPR (license plate recognition)
3. Connect WiFi CSI sensors via MQTT
4. Deploy the dashboard app (this repo!)

---

## Tools Needed
- Laptop with SSH access
- Basic networking knowledge
- Wall mounts / outdoor enclosures for cameras
- Optional: UPS for backup power

---

## Cost Breakdown
| Category | Low End | High End |
|----------|---------|----------|
| Cameras (9) | $450 | $700 |
| PoE Switch | $80 | $150 |
| Server | $150 | $300 |
| Storage | $80 | $150 |
| Cables/Misc | $100 | $200 |
| **TOTAL** | **$860** | **$1,500** |

---

## Why This Works for Customers
- ✅ 100% private (no cloud)
- ✅ AI detects people, animals, vehicles
- ✅ License plate recognition
- ✅ Smart chat ("what happened at 3 AM?")
- ✅ Expandable (start with 3 cameras, add more)
- ✅ Professional dashboard mobile app

---

## Need Help?
- Frigate docs: https://docs.frigate.video
- Home Assistant: https://www.home-assistant.io
- This project's code: https://github.com/Baloo8721/PropertyGuardAi