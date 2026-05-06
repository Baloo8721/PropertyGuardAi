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