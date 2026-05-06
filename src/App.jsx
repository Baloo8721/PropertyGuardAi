import { useState, useEffect, useRef } from 'react'

const CAMERAS = [
  { id: 1, name: "Front-Left", zone: "perimeter", status: "live", threat: null },
  { id: 2, name: "Front-Right", zone: "perimeter", status: "live", threat: null },
  { id: 3, name: "Driveway", zone: "entry", status: "live", threat: "vehicle" },
  { id: 4, name: "Front Door", zone: "entry", status: "live", threat: null },
  { id: 5, name: "Back-Left", zone: "backyard", status: "live", threat: null },
  { id: 6, name: "Back-Right", zone: "backyard", status: "live", threat: null },
  { id: 7, name: "Backyard", zone: "backyard", status: "live", threat: "animal" },
  { id: 8, name: "Side Gate", zone: "perimeter", status: "offline", threat: null },
  { id: 9, name: "Feeder Cam", zone: "wildlife", status: "live", threat: "animal" },
]

const EVENTS = [
  { id: 1, time: "08:47", type: "vehicle", label: "Toyota Camry", plate: "7XBK492", cam: "Driveway", confidence: 0.94, thumb: null, read: false },
  { id: 2, time: "08:31", type: "animal", label: "Squirrel #3 (Patches)", cam: "Feeder Cam", confidence: 0.88, routine: true, read: false },
  { id: 3, time: "07:55", type: "person", label: "Person", cam: "Front-Right", confidence: 0.97, read: true },
  { id: 4, time: "07:44", type: "animal", label: "Cardinal (male)", cam: "Feeder Cam", confidence: 0.82, read: true },
  { id: 5, time: "07:12", type: "vehicle", label: "FedEx Truck", plate: "FL-FEDEX", cam: "Driveway", confidence: 0.91, read: true },
  { id: 6, time: "06:38", type: "animal", label: "Raccoon", cam: "Back-Left", confidence: 0.86, read: true },
  { id: 7, time: "03:14", type: "person", label: "Unknown Person", cam: "Side Gate", confidence: 0.79, alert: true, read: false },
  { id: 8, time: "02:48", type: "animal", label: "Opossum", cam: "Backyard", confidence: 0.91, read: true },
]

const ANIMALS_TODAY = [
  { name: "Patches (Squirrel #3)", visits: 4, lastSeen: "08:31", icon: "🐿️", routine: true },
  { name: "Cardinal (male)", visits: 2, lastSeen: "07:44", icon: "🐦", routine: false },
  { name: "Raccoon", visits: 1, lastSeen: "06:38", icon: "🦝", routine: false },
  { name: "Opossum", visits: 1, lastSeen: "02:48", icon: "🐾", routine: false },
  { name: "Blue Jay", visits: 3, lastSeen: "07:50", icon: "🐦‍⬛", routine: true },
]

const VEHICLES_TODAY = [
  { plate: "7XBK492", make: "Toyota Camry", visits: 2, lastSeen: "08:47", known: true, label: "Neighbor — Dave" },
  { plate: "FL-FEDEX", make: "FedEx Truck", visits: 1, lastSeen: "07:12", known: true, label: "Delivery" },
  { plate: "3RNZ019", make: "Unknown Sedan", visits: 1, lastSeen: "06:01", known: false, label: null },
]

const WIFI_ZONES = [
  { zone: "Front Entry", active: false, lastMotion: "07:55", level: 0 },
  { zone: "Living Room", active: true, lastMotion: "08:51", level: 85 },
  { zone: "Garage", active: false, lastMotion: "07:12", level: 0 },
  { zone: "Backyard", active: false, lastMotion: "06:38", level: 10 },
  { zone: "Side Gate", active: false, lastMotion: "03:14", level: 5 },
]

const ALERTS = [
  { id: 1, severity: "high", message: "Unknown person at Side Gate — 3:14 AM", time: "03:14", acked: false },
  { id: 2, severity: "medium", message: "Camera 8 (Side Gate) offline", time: "06:00", acked: false },
  { id: 3, severity: "low", message: "Unknown vehicle (3RNZ019) passed twice", time: "06:01", acked: true },
]

const LLM_HISTORY = [
  { role: "assistant", text: "Good morning. Here's your overnight summary: 1 anomalous person detected at 3:14 AM near the side gate — confidence 79%, no plate, departed within 4 minutes. Cam 8 went offline at ~6 AM. Patches (Squirrel #3) arrived at 8:31 on schedule — routine confirmed. All other activity nominal." },
]

const DAILY_SUMMARY = {
  date: "Tuesday, May 5",
  totalEvents: 41,
  people: 3,
  vehicles: 6,
  animals: 14,
  packages: 1,
  anomalies: 1,
  systemHealth: 88,
  uptime: "23h 51m",
  recordingGB: 12.4,
  threeDUpdated: "02:00 AM",
}

const C = {
  bg: "#070B11",
  surface: "#0D1420",
  card: "#111827",
  border: "#1E2D45",
  borderBright: "#2A4060",
  accent: "#00D4FF",
  accentDim: "#0099BB",
  green: "#00FF88",
  greenDim: "#00994D",
  orange: "#FF8C00",
  red: "#FF3B3B",
  yellow: "#FFD700",
  purple: "#A855F7",
  text: "#E8F0FE",
  textMid: "#8BA3C4",
  textDim: "#4A6080",
}

const styles = {
  global: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      background: ${C.bg}; 
      color: ${C.text}; 
      font-family: 'Outfit', sans-serif; 
      overflow-x: hidden; 
    }
    .mono { font-family: 'Space Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
    .shell { display: flex; flex-direction: column; min-height: 100vh; max-width: 480px; margin: 0 auto; position: relative; }
    .topbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(7,11,17,0.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid ${C.border};
      padding: 10px 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .topbar-logo { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: ${C.accent}; letter-spacing: 2px; }
    .topbar-logo span { color: ${C.textDim}; }
    .topbar-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: ${C.textMid}; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.green}; box-shadow: 0 0 6px ${C.green}; animation: pulse 2s infinite; }
    .pulse-dot.red { background: ${C.red}; box-shadow: 0 0 6px ${C.red}; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .bottomnav {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 480px; z-index: 100;
      background: rgba(13,20,32,0.96); backdrop-filter: blur(16px);
      border-top: 1px solid ${C.border};
      display: flex;
    }
    .nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 10px 4px 12px; gap: 3px; cursor: pointer; transition: all 0.2s;
      font-size: 10px; color: ${C.textDim}; font-weight: 500; letter-spacing: 0.5px;
      position: relative; border: none; background: none;
    }
    .nav-item.active { color: ${C.accent}; }
    .nav-item.active .nav-icon { color: ${C.accent}; }
    .nav-icon { font-size: 20px; line-height: 1; }
    .nav-badge {
      position: absolute; top: 6px; right: calc(50% - 16px);
      background: ${C.red}; color: white; font-size: 9px; font-weight: 700;
      border-radius: 8px; padding: 1px 5px; min-width: 16px; text-align: center;
    }
    .content { flex: 1; padding: 12px 12px 90px; display: flex; flex-direction: column; gap: 12px; }
    .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 14px; overflow: hidden; }
    .card-header { padding: 12px 14px 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${C.border}; }
    .card-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${C.textMid}; text-transform: uppercase; }
    .card-badge { font-size: 10px; font-family: 'Space Mono', monospace; color: ${C.accent}; background: rgba(0,212,255,0.1); padding: 2px 8px; border-radius: 20px; }
    .hero { background: linear-gradient(135deg, #0D1F35 0%, #071525 60%, #0A1A2E 100%); border: 1px solid ${C.borderBright}; border-radius: 16px; padding: 16px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%); }
    .hero-date { font-size: 11px; color: ${C.textDim}; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase; font-family: 'Space Mono', monospace; }
    .hero-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
    .hero-title .ok { color: ${C.green}; }
    .hero-title .warn { color: ${C.orange}; }
    .hero-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .hero-stat { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 10px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.04); }
    .hero-stat-val { font-size: 24px; font-weight: 800; font-family: 'Space Mono', monospace; line-height: 1; }
    .hero-stat-lbl { font-size: 10px; color: ${C.textDim}; margin-top: 3px; letter-spacing: 0.5px; }
    .hero-stat-val.people { color: ${C.accent}; }
    .hero-stat-val.vehicles { color: ${C.orange}; }
    .hero-stat-val.animals { color: ${C.green}; }
    .hero-stat-val.alert { color: ${C.red}; }
    .hero-stat-val.ok { color: ${C.textMid}; }
    .hero-bottom { display: flex; gap: 8px; margin-top: 10px; }
    .hero-chip { font-size: 10px; padding: 4px 10px; border-radius: 20px; font-family: 'Space Mono', monospace; background: rgba(0,0,0,0.4); border: 1px solid ${C.border}; }
    .hero-chip.green { border-color: ${C.greenDim}; color: ${C.green}; }
    .hero-chip.orange { border-color: rgba(255,140,0,0.4); color: ${C.orange}; }
    .alert-strip { border-radius: 10px; padding: 10px 12px; display: flex; align-items: flex-start; gap: 10px; border: 1px solid; }
    .alert-strip.high { background: rgba(255,59,59,0.08); border-color: rgba(255,59,59,0.3); }
    .alert-strip.medium { background: rgba(255,140,0,0.08); border-color: rgba(255,140,0,0.3); }
    .alert-strip.low { background: rgba(255,215,0,0.06); border-color: rgba(255,215,0,0.2); }
    .alert-icon { font-size: 18px; line-height: 1; margin-top: 1px; }
    .alert-text { flex: 1; }
    .alert-msg { font-size: 13px; font-weight: 500; }
    .alert-strip.high .alert-msg { color: ${C.red}; }
    .alert-strip.medium .alert-msg { color: ${C.orange}; }
    .alert-strip.low .alert-msg { color: ${C.yellow}; }
    .alert-time { font-size: 10px; color: ${C.textDim}; font-family: 'Space Mono', monospace; margin-top: 2px; }
    .alert-ack { font-size: 10px; padding: 3px 8px; border-radius: 6px; border: 1px solid ${C.border}; background: none; color: ${C.textDim}; cursor: pointer; }
    .cam-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px; }
    .cam-cell { aspect-ratio: 16/10; border-radius: 8px; position: relative; overflow: hidden; cursor: pointer; border: 1.5px solid ${C.border}; background: #050A10; transition: border-color 0.2s; }
    .cam-cell:hover { border-color: ${C.accent}; }
    .cam-cell.active-threat { border-color: ${C.orange}; box-shadow: 0 0 12px rgba(255,140,0,0.3); animation: camPulse 2s infinite; }
    .cam-cell.offline { opacity: 0.4; }
    @keyframes camPulse { 0%,100% { box-shadow: 0 0 8px rgba(255,140,0,0.2); } 50% { box-shadow: 0 0 16px rgba(255,140,0,0.5); } }
    .cam-visual { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
    .cam-scene { position: absolute; inset: 0; }
    .cam-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 5px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); }
    .cam-name { font-size: 8px; font-weight: 700; color: white; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cam-tag { font-size: 7px; color: ${C.orange}; font-family: 'Space Mono', monospace; }
    .cam-dot { position: absolute; top: 4px; right: 4px; width: 5px; height: 5px; border-radius: 50%; }
    .cam-dot.live { background: ${C.red}; animation: pulse 1.5s infinite; }
    .cam-dot.offline { background: ${C.textDim}; }
    .event-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid ${C.border}; cursor: pointer; transition: background 0.15s; }
    .event-row:hover { background: rgba(255,255,255,0.02); }
    .event-row:last-child { border-bottom: none; }
    .event-row.unread { background: rgba(0,212,255,0.03); }
    .event-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .event-icon-wrap.person { background: rgba(0,212,255,0.12); }
    .event-icon-wrap.vehicle { background: rgba(255,140,0,0.12); }
    .event-icon-wrap.animal { background: rgba(0,255,136,0.10); }
    .event-icon-wrap.alert-ev { background: rgba(255,59,59,0.12); }
    .event-main { flex: 1; min-width: 0; }
    .event-label { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .event-label .alert-flag { color: ${C.red}; font-size: 11px; margin-left: 4px; }
    .event-meta { font-size: 10px; color: ${C.textDim}; margin-top: 1px; }
    .event-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .event-time { font-size: 10px; font-family: 'Space Mono', monospace; color: ${C.textDim}; }
    .event-conf { font-size: 9px; color: ${C.green}; background: rgba(0,255,136,0.08); padding: 1px 6px; border-radius: 8px; }
    .event-unread-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.accent}; }
    .plate-badge { font-family: 'Space Mono', monospace; font-size: 10px; background: rgba(255,140,0,0.12); color: ${C.orange}; padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,140,0,0.25); display: inline-block; margin-left: 4px; }
    .animal-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid ${C.border}; }
    .animal-row:last-child { border-bottom: none; }
    .animal-emoji { font-size: 24px; }
    .animal-name { font-size: 13px; font-weight: 600; }
    .animal-visits { font-size: 10px; color: ${C.textDim}; margin-top: 1px; }
    .animal-right { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
    .routine-badge { font-size: 9px; color: ${C.green}; background: rgba(0,255,136,0.1); padding: 1px 7px; border-radius: 10px; border: 1px solid rgba(0,255,136,0.2); }
    .new-badge { font-size: 9px; color: ${C.orange}; background: rgba(255,140,0,0.1); padding: 1px 7px; border-radius: 10px; border: 1px solid rgba(255,140,0,0.2); }
    .vehicle-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid ${C.border}; }
    .vehicle-row:last-child { border-bottom: none; }
    .vehicle-plate-big { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.05); border: 1px solid ${C.border}; padding: 4px 8px; border-radius: 6px; min-width: 80px; text-align: center; }
    .vehicle-plate-big.unknown { border-color: rgba(255,59,59,0.3); color: ${C.red}; }
    .vehicle-info { flex: 1; }
    .vehicle-make { font-size: 13px; font-weight: 600; }
    .vehicle-label { font-size: 10px; color: ${C.textDim}; margin-top: 1px; }
    .wifi-zone { padding: 10px 14px; border-bottom: 1px solid ${C.border}; display: flex; align-items: center; gap: 10px; }
    .wifi-zone:last-child { border-bottom: none; }
    .wifi-name { font-size: 13px; font-weight: 500; flex: 1; }
    .wifi-bar-wrap { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
    .wifi-bar { height: 100%; border-radius: 2px; background: linear-gradient(90deg, ${C.accent}, ${C.green}); transition: width 1s; }
    .wifi-status { font-size: 10px; font-family: 'Space Mono', monospace; width: 52px; text-align: right; }
    .wifi-status.active { color: ${C.green}; }
    .wifi-status.inactive { color: ${C.textDim}; }
    .sys-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; }
    .sys-stat { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.04); }
    .sys-val { font-size: 20px; font-weight: 800; font-family: 'Space Mono', monospace; }
    .sys-val.green { color: ${C.green}; }
    .sys-val.orange { color: ${C.orange}; }
    .sys-val.accent { color: ${C.accent}; }
    .sys-lbl { font-size: 10px; color: ${C.textDim}; margin-top: 3px; }
    .health-bar-wrap { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 8px; overflow: hidden; }
    .health-bar { height: 100%; border-radius: 2px; }
    .health-bar.good { background: linear-gradient(90deg, ${C.greenDim}, ${C.green}); }
    .health-bar.warn { background: linear-gradient(90deg, #996600, ${C.orange}); }
    .threedgs { margin: 10px; border-radius: 10px; overflow: hidden; background: linear-gradient(135deg, #050D18 0%, #0A1628 100%); border: 1px solid ${C.border}; height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; position: relative; }
    .threedgs-label { font-size: 12px; color: ${C.textMid}; font-weight: 600; letter-spacing: 1px; }
    .threedgs-sub { font-size: 10px; color: ${C.textDim}; font-family: 'Space Mono', monospace; }
    .threedgs-btn { margin-top: 8px; padding: 6px 16px; border-radius: 8px; background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.3); color: ${C.accent}; font-size: 11px; font-weight: 600; cursor: pointer; }
    .orbit-ring { position: absolute; width: 140px; height: 70px; border: 1px solid rgba(0,212,255,0.15); border-radius: 50%; animation: orbit 8s linear infinite; }
    .orbit-ring2 { width: 100px; height: 50px; border-color: rgba(0,255,136,0.1); animation-duration: 12s; animation-direction: reverse; }
    .orbit-dot { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: ${C.accent}; top: -2.5px; left: 50%; transform: translateX(-50%); box-shadow: 0 0 6px ${C.accent}; }
    @keyframes orbit { from { transform: rotateX(60deg) rotate(0deg); } to { transform: rotateX(60deg) rotate(360deg); } }
    .drone-card { margin: 10px; border-radius: 10px; overflow: hidden; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); padding: 14px; }
    .drone-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .drone-title { font-size: 13px; font-weight: 700; color: ${C.purple}; }
    .drone-status { font-size: 10px; padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(168,85,247,0.3); color: ${C.purple}; font-family: 'Space Mono', monospace; }
    .drone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .drone-stat { text-align: center; }
    .drone-stat-val { font-size: 16px; font-weight: 800; color: ${C.purple}; font-family: 'Space Mono', monospace; }
    .drone-stat-lbl { font-size: 9px; color: ${C.textDim}; margin-top: 2px; }
    .drone-btn { width: 100%; margin-top: 10px; padding: 8px; border-radius: 8px; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.3); color: ${C.purple}; font-size: 12px; font-weight: 700; cursor: pointer; letter-spacing: 1px; }
    .chat-messages { padding: 12px; display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; }
    .chat-bubble { max-width: 85%; padding: 10px 12px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
    .chat-bubble.assistant { background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.15); color: ${C.text}; align-self: flex-start; border-radius: 4px 12px 12px 12px; }
    .chat-bubble.user { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: ${C.text}; align-self: flex-end; border-radius: 12px 4px 12px 12px; }
    .chat-who { font-size: 9px; letter-spacing: 1px; font-weight: 700; margin-bottom: 4px; }
    .chat-who.ai { color: ${C.accent}; }
    .chat-who.me { color: ${C.textDim}; }
    .chat-input-row { display: flex; gap: 8px; padding: 0 12px 12px; }
    .chat-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid ${C.border}; border-radius: 10px; padding: 9px 12px; color: ${C.text}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
    .chat-input:focus { border-color: rgba(0,212,255,0.4); }
    .chat-input::placeholder { color: ${C.textDim}; }
    .chat-send { width: 38px; height: 38px; border-radius: 10px; background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); color: ${C.accent}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .chat-thinking { display: flex; gap: 4px; padding: 4px 0; }
    .chat-thinking span { width: 6px; height: 6px; border-radius: 50%; background: ${C.accent}; opacity: 0.4; animation: think 1.4s infinite; }
    .chat-thinking span:nth-child(2) { animation-delay: 0.2s; }
    .chat-thinking span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes think { 0%,80%,100% { opacity:0.2; transform: scale(0.8); } 40% { opacity:1; transform: scale(1.1); } }
    .tabs { display: flex; padding: 0 12px; gap: 4px; border-bottom: 1px solid ${C.border}; }
    .tab { padding: 10px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: ${C.textDim}; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab.active { color: ${C.accent}; border-bottom-color: ${C.accent}; }
    .section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: ${C.textDim}; text-transform: uppercase; padding: 0 2px; }
    .filter-row { display: flex; gap: 6px; padding: 0 0 4px; overflow-x: auto; scrollbar-width: none; }
    .filter-row::-webkit-scrollbar { display: none; }
    .filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; border: 1px solid ${C.border}; color: ${C.textDim}; background: transparent; transition: all 0.15s; }
    .filter-chip.active { background: rgba(0,212,255,0.12); border-color: rgba(0,212,255,0.4); color: ${C.accent}; }
    .toggle-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMid}; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .toggle-btn.on { border-color: rgba(0,255,136,0.4); color: ${C.green}; background: rgba(0,255,136,0.08); }
    .cam-full-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.96); display: flex; flex-direction: column; }
    .cam-full-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid ${C.border}; }
    .cam-full-title { font-size: 15px; font-weight: 700; }
    .cam-full-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.08); border: none; color: white; font-size: 16px; cursor: pointer; }
    .cam-full-view { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .cam-full-screen { width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; border: 1px solid ${C.border}; position: relative; }
    .cam-full-info { padding: 12px 16px; display: flex; gap: 10px; }
    .cam-info-chip { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
    .cam-info-chip.live { background: rgba(255,59,59,0.15); color: ${C.red}; border: 1px solid rgba(255,59,59,0.3); }
    .cam-info-chip.res { background: rgba(0,212,255,0.1); color: ${C.accent}; border: 1px solid rgba(0,212,255,0.25); }
  `
}

function CamScene({ cam, full = false }) {
  const scenes = {
    1: { type: "night-sky", label: "Clear night — no motion" },
    2: { type: "night-sky", label: "Clear" },
    3: { type: "driveway", label: "Vehicle detected" },
    4: { type: "entry", label: "Clear — porch light on" },
    5: { type: "backyard-night", label: "Animal motion" },
    6: { type: "backyard-night", label: "Clear" },
    7: { type: "yard", label: "Raccoon detected 06:38" },
    8: { type: "offline", label: "OFFLINE" },
    9: { type: "feeder", label: "Squirrel active" },
  }
  const s = scenes[cam.id] || scenes[1]

  const backgrounds = {
    "night-sky": "linear-gradient(180deg, #050A18 0%, #0A1525 60%, #0D1A30 100%)",
    "driveway": "linear-gradient(180deg, #080F1A 0%, #0D1828 50%, #060E18 100%)",
    "entry": "linear-gradient(180deg, #0A1220 0%, #141F35 100%)",
    "backyard-night": "linear-gradient(180deg, #050A15 0%, #080F20 100%)",
    "yard": "linear-gradient(180deg, #060B18 0%, #0C1525 100%)",
    "feeder": "linear-gradient(180deg, #040A14 0%, #071020 100%)",
    "offline": "#070B11",
  }

  const overlayEmoji = {
    "driveway": "🚗",
    "backyard-night": "🦝",
    "feeder": "🐿️",
    "yard": "🦝",
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: backgrounds[s.type] || backgrounds["night-sky"] }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)", pointerEvents: "none" }} />
      {[...Array(full ? 30 : 10)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: Math.random() > 0.8 ? 2 : 1, height: Math.random() > 0.8 ? 2 : 1, borderRadius: "50%", background: "white", top: `${Math.random() * 60}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.6 + 0.2 }} />
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)" }} />
      {overlayEmoji[s.type] && (
        <div style={{ position: "absolute", bottom: "30%", fontSize: full ? 32 : 14, opacity: 0.8 }}>{overlayEmoji[s.type]}</div>
      )}
      {!full && (
        <div style={{ position: "absolute", top: 4, left: 4, fontSize: 6, fontFamily: "'Space Mono', monospace", color: "rgba(0,255,136,0.7)" }}>
          {new Date().toLocaleTimeString("en-US", { hour12: false })}
        </div>
      )}
      {s.type === "offline" && <div style={{ color: C.textDim, fontSize: full ? 16 : 9, fontWeight: 700, letterSpacing: 2 }}>OFFLINE</div>}
    </div>
  )
}

function AlertItem({ alert, onAck }) {
  const icons = { high: "🚨", medium: "⚠️", low: "ℹ️" }
  return (
    <div className={`alert-strip ${alert.severity}`} style={{ opacity: alert.acked ? 0.5 : 1 }}>
      <div className="alert-icon">{icons[alert.severity]}</div>
      <div className="alert-text">
        <div className="alert-msg">{alert.message}</div>
        <div className="alert-time">{alert.time}</div>
      </div>
      {!alert.acked && <button className="alert-ack" onClick={() => onAck(alert.id)}>ACK</button>}
    </div>
  )
}

function EventRow({ ev }) {
  const icons = { person: "🧍", vehicle: "🚗", animal: "🐾" }
  const typeClass = { person: "person", vehicle: "vehicle", animal: "animal" }
  return (
    <div className={`event-row ${!ev.read ? "unread" : ""}`}>
      <div className={`event-icon-wrap ${ev.alert ? "alert-ev" : typeClass[ev.type]}`}>{ev.alert ? "🚨" : icons[ev.type]}</div>
      <div className="event-main">
        <div className="event-label">
          {ev.label}
          {ev.alert && <span className="alert-flag">⚠️ ALERT</span>}
          {ev.plate && <span className="plate-badge">{ev.plate}</span>}
        </div>
        <div className="event-meta">{ev.cam}{ev.routine ? " · On routine ✓" : ""}</div>
      </div>
      <div className="event-right">
        <span className="event-time">{ev.time}</span>
        <span className="event-conf">{Math.round(ev.confidence * 100)}%</span>
        {!ev.read && <span className="event-unread-dot" />}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState("home")
  const [alerts, setAlerts] = useState(ALERTS)
  const [eventFilter, setEventFilter] = useState("all")
  const [selectedCam, setSelectedCam] = useState(null)
  const [chatMessages, setChatMessages] = useState(LLM_HISTORY)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [droneArmed, setDroneArmed] = useState(false)
  const chatEndRef = useRef(null)

  const unreadAlerts = alerts.filter(a => !a.acked).length
  const unreadEvents = EVENTS.filter(e => !e.read).length

  const ackAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, acked: true } : a))

  const filteredEvents = eventFilter === "all" ? EVENTS : EVENTS.filter(e => e.type === eventFilter || (eventFilter === "alerts" && e.alert))

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
    setChatLoading(true)

    setTimeout(() => {
      const replies = [
        "Checking event logs... Person detected at Front-Right at 7:55 AM. No anomalies.",
        "Patches is on routine — arrived at feeder at 8:31 AM, matching historical pattern.",
        "One unknown plate today: 3RNZ019, sedan, passed at 6:01 AM. No match in database.",
        "System healthy. 8 of 9 cameras online. Side Gate camera needs attention.",
        "No significant alerts since 3:14 AM. Drone battery at 94%, ready if needed."
      ]
      const reply = replies[Math.floor(Math.random() * replies.length)]
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }])
      setChatLoading(false)
    }, 1500)
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages, chatLoading])

  const navItems = [
    { id: "home", icon: "⌂", label: "HOME", badge: null },
    { id: "cameras", icon: "◉", label: "CAMS", badge: null },
    { id: "events", icon: "≡", label: "EVENTS", badge: unreadEvents || null },
    { id: "intel", icon: "◈", label: "INTEL", badge: null },
    { id: "guard", icon: "◆", label: "GUARD", badge: unreadAlerts || null },
  ]

  return (
    <>
      <style>{styles.global}</style>
      <div className="shell">
        <div className="topbar">
          <div className="topbar-logo">PROPERTY<span>·</span>GUARD</div>
          <div className="topbar-status">
            <div className={`pulse-dot ${CAMERAS.some(c => c.status === "offline") ? "red" : ""}`} />
            {CAMERAS.filter(c => c.status === "live").length}/{CAMERAS.length} LIVE
          </div>
        </div>

        {selectedCam && (
          <div className="cam-full-overlay">
            <div className="cam-full-top">
              <div className="cam-full-title">CAM {selectedCam.id} — {selectedCam.name.toUpperCase()}</div>
              <button className="cam-full-close" onClick={() => setSelectedCam(null)}>✕</button>
            </div>
            <div className="cam-full-view">
              <div className="cam-full-screen"><CamScene cam={selectedCam} full /></div>
            </div>
            <div className="cam-full-info">
              <span className="cam-info-chip live">● LIVE</span>
              <span className="cam-info-chip res">4K / H.264</span>
              <span className="cam-info-chip res">{selectedCam.zone.toUpperCase()}</span>
              {selectedCam.status === "offline" && <span className="cam-info-chip" style={{ color: C.red, borderColor: "rgba(255,59,59,0.3)", background: "rgba(255,59,59,0.1)" }}>OFFLINE</span>}
            </div>
          </div>
        )}

        {tab === "home" && (
          <div className="content">
            <div className="hero">
              <div className="hero-date">{DAILY_SUMMARY.date}</div>
              <div className="hero-title">
                <span className="warn">{DAILY_SUMMARY.anomalies}</span> <span className="ok">anomalies</span> · <span className="ok">41</span> events
              </div>
              <div className="hero-grid">
                <div className="hero-stat"><div className="hero-stat-val people">{DAILY_SUMMARY.people}</div><div className="hero-stat-lbl">People</div></div>
                <div className="hero-stat"><div className="hero-stat-val vehicles">{DAILY_SUMMARY.vehicles}</div><div className="hero-stat-lbl">Vehicles</div></div>
                <div className="hero-stat"><div className="hero-stat-val animals">{DAILY_SUMMARY.animals}</div><div className="hero-stat-lbl">Animals</div></div>
              </div>
              <div className="hero-bottom">
                <div className="hero-chip green">● All clear</div>
                <div className="hero-chip">3DGS: {DAILY_SUMMARY.threeDUpdated}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Active Alerts</span><span className="card-badge">{unreadAlerts} UNREAD</span></div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>{alerts.map(a => <AlertItem key={a.id} alert={a} onAck={ackAlert} />)}</div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Camera Grid</span><span className="card-badge">9 ACTIVE</span></div>
              <div className="cam-grid">
                {CAMERAS.slice(0, 6).map(cam => (
                  <div key={cam.id} className={`cam-cell ${cam.threat ? 'active-threat' : ''} ${cam.status === 'offline' ? 'offline' : ''}`} onClick={() => setSelectedCam(cam)}>
                    <div className="cam-visual"><CamScene cam={cam} /></div>
                    <div className="cam-overlay">
                      <div className="cam-name">{cam.name}</div>
                      {cam.threat && <div className="cam-tag">⚠ {cam.threat}</div>}
                    </div>
                    <div className={`cam-dot ${cam.status}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Recent Events</span></div>
              {EVENTS.slice(0, 4).map(ev => <EventRow key={ev.id} ev={ev} />)}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">WiFi CSI Presence</span></div>
              {WIFI_ZONES.map(z => (
                <div key={z.zone} className="wifi-zone">
                  <div className="wifi-name">{z.zone}</div>
                  <div className="wifi-bar-wrap"><div className="wifi-bar" style={{ width: `${z.level}%` }} /></div>
                  <div className={`wifi-status ${z.active ? 'active' : 'inactive'}`}>{z.active ? 'ACTIVE' : '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "cameras" && (
          <div className="content">
            <div className="card">
              <div className="card-header"><span className="card-title">All Cameras</span><span className="card-badge">9 TOTAL</span></div>
              <div className="cam-grid">
                {CAMERAS.map(cam => (
                  <div key={cam.id} className={`cam-cell ${cam.threat ? 'active-threat' : ''} ${cam.status === 'offline' ? 'offline' : ''}`} onClick={() => setSelectedCam(cam)}>
                    <div className="cam-visual"><CamScene cam={cam} /></div>
                    <div className="cam-overlay">
                      <div className="cam-name">{cam.name}</div>
                      {cam.threat && <div className="cam-tag">⚠ {cam.threat}</div>}
                    </div>
                    <div className={`cam-dot ${cam.status}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="threedgs">
              <div className="orbit-ring"><div className="orbit-dot" /></div>
              <div className="orbit-ring2"><div className="orbit-dot" /></div>
              <div className="threedgs-label">3D GAUSSIAN SPLAT VIEWER</div>
              <div className="threedgs-sub">Property Map · Last: 2:00 AM</div>
              <button className="threedgs-btn">Open 3D Viewer</button>
            </div>

            <div className="drone-card">
              <div className="drone-header">
                <span className="drone-title">🚁 AUTONOMOUS DRONE</span>
                <span className="drone-status">STANDBY</span>
              </div>
              <div className="drone-grid">
                <div className="drone-stat"><div className="drone-stat-val">94%</div><div className="drone-stat-lbl">Battery</div></div>
                <div className="drone-stat"><div className="drone-stat-val">12</div><div className="drone-stat-lbl">Flights</div></div>
                <div className="drone-stat"><div className="drone-stat-val">2.1km</div><div className="drone-stat-lbl">Range</div></div>
              </div>
              <button className={`drone-btn ${droneArmed ? 'on' : ''}`} onClick={() => setDroneArmed(!droneArmed)}>{droneArmed ? '■ LAUNCH' : '▲ ARM'}</button>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div className="content">
            <div className="card">
              <div className="card-header"><span className="card-title">Event Log</span><span className="card-badge">{EVENTS.length} TODAY</span></div>
              <div className="filter-row" style={{ padding: 12 }}>
                {['all', 'alerts', 'person', 'vehicle', 'animal'].map(f => (
                  <button key={f} className={`filter-chip ${eventFilter === f ? 'active' : ''}`} onClick={() => setEventFilter(f)}>{f.toUpperCase()}</button>
                ))}
              </div>
              {filteredEvents.map(ev => <EventRow key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}

        {tab === "intel" && (
          <div className="content">
            <div className="card">
              <div className="card-header"><span className="card-title">Wildlife Tracker</span></div>
              {ANIMALS_TODAY.map(a => (
                <div key={a.name} className="animal-row">
                  <span className="animal-emoji">{a.icon}</span>
                  <div>
                    <div className="animal-name">{a.name}</div>
                    <div className="animal-visits">{a.visits} visits · Last: {a.lastSeen}</div>
                  </div>
                  <div className="animal-right">
                    <span className={a.routine ? 'routine-badge' : 'new-badge'}>{a.routine ? 'ROUTINE' : 'NEW'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">LPR Vehicle Log</span></div>
              {VEHICLES_TODAY.map(v => (
                <div key={v.plate} className="vehicle-row">
                  <div className={`vehicle-plate-big ${v.known ? '' : 'unknown'}`}>{v.plate}</div>
                  <div className="vehicle-info">
                    <div className="vehicle-make">{v.make}</div>
                    <div className="vehicle-label">{v.visits} visits · {v.label || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">System Health</span></div>
              <div className="sys-grid">
                <div className="sys-stat"><div className="sys-val green">{DAILY_SUMMARY.systemHealth}%</div><div className="sys-lbl">Health Score</div></div>
                <div className="sys-stat"><div className="sys-val accent">{DAILY_SUMMARY.uptime}</div><div className="sys-lbl">Uptime</div></div>
                <div className="sys-stat"><div className="sys-val">{DAILY_SUMMARY.recordingGB} GB</div><div className="sys-lbl">Recorded Today</div></div>
                <div className="sys-stat"><div className="sys-val">{CAMERAS.filter(c => c.status === 'live').length}/9</div><div className="sys-lbl">Cameras Online</div></div>
              </div>
              <div style={{ paddingTop: 0, paddingRight: 12, paddingBottom: 12, paddingLeft: 12 }}>
                <div className="health-bar-wrap"><div className="health-bar good" style={{ width: `${DAILY_SUMMARY.systemHealth}%` }} /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">WiFi CSI Zone Map</span></div>
              {WIFI_ZONES.map(z => (
                <div key={z.zone} className="wifi-zone">
                  <div className="wifi-name">{z.zone}</div>
                  <div className="wifi-bar-wrap"><div className="wifi-bar" style={{ width: `${z.level}%` }} /></div>
                  <div className={`wifi-status ${z.active ? 'active' : 'inactive'}`}>{z.active ? 'ACTIVE' : '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "guard" && (
          <div className="content">
            <div className="card">
              <div className="card-header"><span className="card-title">GUARDIAN AI</span><span className="card-badge">ONLINE</span></div>
              <div className="chat-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
                    <div className={`chat-who ${m.role === 'user' ? 'me' : 'ai'}`}>{m.role === 'user' ? 'YOU' : 'GUARDIAN'}</div>
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble assistant">
                    <div className="chat-who ai">GUARDIAN</div>
                    <div className="chat-thinking"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Ask the Guardian..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                <button className="chat-send" onClick={sendChat}>➤</button>
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textDim, textAlign: 'center', padding: 8 }}>Try: "What happened at 3 AM?" · "Is Patches on routine?" · "Unknown vehicles today?"</div>
          </div>
        )}

        <div className="bottomnav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}