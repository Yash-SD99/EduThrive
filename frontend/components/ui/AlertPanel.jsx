"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"

// ─────────────────────────────────────────────────────────────
//  Visual config
// ─────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  critical: {
    color:   "#D85A30",
    bg:      "#D85A3010",
    border:  "#D85A3040",
    dot:     "#D85A30",
    label:   "Critical",
    icon:    "●",
  },
  warning: {
    color:   "#EF9F27",
    bg:      "#EF9F2710",
    border:  "#EF9F2740",
    dot:     "#EF9F27",
    label:   "Warning",
    icon:    "◆",
  },
  insight: {
    color:   "#378ADD",
    bg:      "#378ADD10",
    border:  "#378ADD40",
    dot:     "#378ADD",
    label:   "Insight",
    icon:    "◉",
  },
  positive: {
    color:   "#1D9E75",
    bg:      "#1D9E7510",
    border:  "#1D9E7540",
    dot:     "#1D9E75",
    label:   "Good",
    icon:    "◎",
  },
}

const CATEGORY_LABEL = {
  attendance:  "Attendance",
  performance: "Performance",
  trend:       "Trend",
  rank:        "Rank",
  compliance:  "Compliance",
  strategic:   "Strategic",
}

const SCOPE_LABEL = {
  individual:  "You",
  class:       "Class",
  department:  "Dept",
  institute:   "Institute",
}

// ─────────────────────────────────────────────────────────────
//  Single alert card
// ─────────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss, index }) {
  const cfg = LEVEL_CONFIG[alert.level] ?? LEVEL_CONFIG.insight

  return (
    <div
      style={{
        display:        "flex",
        gap:            12,
        padding:        "12px 14px",
        background:     cfg.bg,
        border:         `0.5px solid ${cfg.border}`,
        borderLeft:     `3px solid ${cfg.color}`,
        borderRadius:   "0 10px 10px 0",
        animation:      `slideIn 0.2s ease ${index * 0.05}s both`,
      }}
    >
      {/* Level dot */}
      <span style={{
        fontSize:   16,
        color:      cfg.color,
        flexShrink: 0,
        marginTop:  1,
        lineHeight: 1,
      }}>
        {cfg.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{
            fontSize:    10,
            fontWeight:  700,
            padding:     "2px 6px",
            borderRadius: 4,
            background:  cfg.color,
            color:       "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {cfg.label}
          </span>
          <span style={{
            fontSize:    10,
            padding:     "2px 6px",
            borderRadius: 4,
            background:  "rgba(136,135,128,0.12)",
            color:       "#888780",
          }}>
            {CATEGORY_LABEL[alert.category] ?? alert.category}
          </span>
          <span style={{
            fontSize:    10,
            padding:     "2px 6px",
            borderRadius: 4,
            background:  "rgba(136,135,128,0.08)",
            color:       "#888780",
          }}>
            {SCOPE_LABEL[alert.scope] ?? alert.scope}
          </span>
          {alert.actionable && (
            <span style={{
              fontSize:    10,
              padding:     "2px 6px",
              borderRadius: 4,
              background:  "rgba(55,138,221,0.1)",
              color:       "#378ADD",
            }}>
              Actionable
            </span>
          )}
        </div>

        {/* Message */}
        <p style={{
          fontSize:   13,
          fontWeight: 500,
          color:      "rgb(var(--text))",
          margin:     0,
          lineHeight: 1.45,
        }}>
          {alert.message}
        </p>

        {/* Detail */}
        {alert.detail && (
          <p style={{
            fontSize:   12,
            color:      "#888780",
            margin:     "4px 0 0",
            lineHeight: 1.4,
          }}>
            {alert.detail}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss"
        style={{
          background:  "none",
          border:      "none",
          cursor:      "pointer",
          color:       "#888780",
          fontSize:    16,
          lineHeight:  1,
          flexShrink:  0,
          padding:     "0 2px",
          opacity:     0.6,
          transition:  "opacity 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
      >
        ✕
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Summary legend (count by level)
// ─────────────────────────────────────────────────────────────
function AlertSummary({ alerts }) {
  const counts = alerts.reduce((acc, a) => {
    acc[a.level] = (acc[a.level] || 0) + 1
    return acc
  }, {})

  const order = ["critical", "warning", "insight", "positive"]
  const active = order.filter((l) => counts[l])

  if (active.length === 0) return null

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {active.map((level) => {
        const cfg = LEVEL_CONFIG[level]
        return (
          <span key={level} style={{
            display:     "flex",
            alignItems:  "center",
            gap:         5,
            fontSize:    12,
            padding:     "3px 10px",
            borderRadius: 20,
            background:  cfg.bg,
            border:      `0.5px solid ${cfg.border}`,
            color:       cfg.color,
            fontWeight:  600,
          }}>
            <span style={{ fontSize: 8 }}>●</span>
            {counts[level]} {cfg.label}
          </span>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main AlertPanel
//
//  Props:
//    role      — "student" | "teacher" | "hod" | "director"
//    title     — panel heading (default "Alerts")
//    style     — additional container style overrides
// ─────────────────────────────────────────────────────────────
export default function AlertPanel({ role, title = "Alerts", style = {} }) {
  const [alerts,    setAlerts]    = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`dismissed-alerts-${role}`) || "[]")
    } catch { return [] }
  })
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [expanded,  setExpanded]  = useState(true)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alerts/${role}`,
        { credentials: "include" }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setAlerts(json.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleDismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = [...prev, id]
      try { localStorage.setItem(`dismissed-alerts-${role}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [role])

  const handleClearDismissed = useCallback(() => {
    setDismissed([])
    try { localStorage.removeItem(`dismissed-alerts-${role}`) } catch {}
  }, [role])

  // Visible = not dismissed
  const visible = alerts.filter((a) => !dismissed.includes(a.id))
  const hasDismissed = dismissed.length > 0

  // Loading skeleton
  if (loading) {
    return (
      <div style={{
        background:   "var(--card)",
        border:       "0.5px solid rgba(136,135,128,0.18)",
        borderRadius: 14,
        padding:      "18px 20px",
        ...style,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {title}
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: 64, borderRadius: 8,
            background: "rgba(136,135,128,0.08)",
            marginBottom: 8,
            animation: "pulse 1.4s ease-in-out infinite",
          }} />
        ))}
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      background:   "var(--card)",
      border:       "0.5px solid rgba(136,135,128,0.18)",
      borderRadius: 14,
      padding:      "18px 20px",
      ...style,
    }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Panel header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: "#888780",
            textTransform: "uppercase", letterSpacing: "0.07em", margin: 0,
          }}>
            {title}
          </p>
          {visible.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 7px", borderRadius: 20,
              background: visible.some((a) => a.level === "critical")
                ? "#D85A3018" : "rgba(136,135,128,0.12)",
              color: visible.some((a) => a.level === "critical")
                ? "#D85A30" : "#888780",
            }}>
              {visible.length}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasDismissed && (
            <button
              onClick={handleClearDismissed}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "#888780",
                textDecoration: "underline",
              }}
            >
              Restore {dismissed.length} dismissed
            </button>
          )}
          <button
            onClick={() => fetchAlerts()}
            title="Refresh alerts"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: "#888780", padding: "0 2px",
            }}
          >
            ↺
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: "#888780", padding: "0 2px",
            }}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {error ? (
            <div style={{
              padding: "12px 14px",
              background: "#D85A3010",
              border: "0.5px solid #D85A3030",
              borderRadius: 8,
              fontSize: 13, color: "#D85A30",
            }}>
              Failed to load alerts: {error}
            </div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: 24, marginBottom: 6 }}>✓</p>
              <p style={{ fontSize: 13, color: "#888780" }}>No active alerts — all clear!</p>
            </div>
          ) : (
            <>
              <AlertSummary alerts={visible} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visible.map((alert, i) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={handleDismiss}
                    index={i}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}