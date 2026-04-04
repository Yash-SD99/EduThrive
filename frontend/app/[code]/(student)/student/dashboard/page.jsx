"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import AlertPanel from "@/components/ui/AlertPanel"

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

const COLORS = {
  blue: "#378ADD",
  teal: "#1D9E75",
  amber: "#EF9F27",
  coral: "#D85A30",
  purple: "#7F77DD",
  green: "#639922",
}
const COLOR_LIST = Object.values(COLORS)

const TYPE_COLORS = {
  Assignment: COLORS.blue,
  Quiz: COLORS.teal,
  Midterm: COLORS.amber,
  Final: COLORS.coral,
}

// Circular progress ring
function RingProgress({ value, size = 100, strokeWidth = 8, color = COLORS.blue, label }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (value / 100) * circumference

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(136,135,128,0.15)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center", marginTop: -4 }}>
        <p style={{ fontSize: 22, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 2 }}>{value}%</p>
        {label && <p style={{ fontSize: 12, color: "#888780" }}>{label}</p>}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = COLORS.blue }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "0.5px solid rgba(136,135,128,0.2)",
      borderRadius: 12,
      padding: "20px 24px",
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 12, color: "#888780", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#888780" }}>{sub}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "0.5px solid rgba(136,135,128,0.2)",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      {children}
    </div>
  )
}

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/student`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message)
        setData(json.data)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid rgba(127,119,221,0.2)`,
            borderTopColor: COLORS.purple, borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#888780", fontSize: 14 }}>Loading your dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  const { summary, attendanceByCourse, marksTimeline, avgScorePerCourse } = data

  // Marks trend line
  const marksLineData = {
    labels: marksTimeline.map((m) => m.title),
    datasets: [{
      label: "Score %",
      data: marksTimeline.map((m) => m.percentage),
      borderColor: COLORS.purple,
      backgroundColor: "rgba(127,119,221,0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: marksTimeline.map((m) =>
        m.percentage >= 75 ? COLORS.teal : m.percentage >= 50 ? COLORS.amber : COLORS.coral
      ),
      pointRadius: 5,
    }],
  }

  // Attendance bar
  const attendanceBarData = {
    labels: attendanceByCourse.map((c) => c.name.length > 16 ? c.name.substring(0, 14) + "…" : c.name),
    datasets: [{
      label: "Attendance %",
      data: attendanceByCourse.map((c) => c.percentage),
      backgroundColor: attendanceByCourse.map((c) =>
        c.percentage >= 75 ? COLORS.teal + "cc" : COLORS.coral + "cc"
      ),
      borderRadius: 6, borderWidth: 0,
    }],
  }

  // Score per course doughnut
  const scoreDoughnut = {
    labels: avgScorePerCourse.map((c) => c.name),
    datasets: [{
      data: avgScorePerCourse.map((c) => c.percentage),
      backgroundColor: avgScorePerCourse.map((_, i) => COLOR_LIST[i % COLOR_LIST.length]),
      borderWidth: 0, hoverOffset: 4,
    }],
  }

  const baseOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 }, maxRotation: 30 } },
      y: { grid: { color: "rgba(136,135,128,0.12)" }, ticks: { color: "#888780", font: { size: 11 } } },
    },
  }

  return (
    <div style={{ padding: "4px 2px 24px", maxWidth: 1200 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 4 }}>
          My Academic Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#888780" }}>Your performance summary across all enrolled courses</p>
      </div>

      <div className="mb-[24px]">
        <AlertPanel role="student" title="Alerts" />
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Enrolled Courses" value={summary.totalCourses} color={COLORS.blue} />
        <StatCard label="Assessments Taken" value={summary.totalAssessmentsGiven} color={COLORS.purple} />
        <StatCard
          label="Overall Score"
          value={`${summary.overallScore}%`}
          sub={summary.overallScore >= 75 ? "Keep it up!" : summary.overallScore >= 50 ? "Room to improve" : "Needs attention"}
          color={summary.overallScore >= 75 ? COLORS.teal : summary.overallScore >= 50 ? COLORS.amber : COLORS.coral}
        />
        <StatCard
          label="Overall Attendance"
          value={`${summary.overallAttendance}%`}
          sub={summary.overallAttendance >= 75 ? "Good standing" : "Below 75% — warning"}
          color={summary.overallAttendance >= 75 ? COLORS.teal : COLORS.coral}
        />
      </div>

      {/* Ring overview */}
      <Section title="At a Glance">
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, paddingTop: 8 }}>
          <RingProgress
            value={summary.overallScore}
            color={summary.overallScore >= 75 ? COLORS.teal : summary.overallScore >= 50 ? COLORS.amber : COLORS.coral}
            label="Overall score"
          />
          <RingProgress
            value={summary.overallAttendance}
            color={summary.overallAttendance >= 75 ? COLORS.teal : COLORS.coral}
            label="Attendance"
          />
          {avgScorePerCourse.map((c, i) => (
            <RingProgress
              key={c.name}
              value={c.percentage}
              color={COLOR_LIST[i % COLOR_LIST.length]}
              label={c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name}
              size={90}
            />
          ))}
        </div>
      </Section>

      <div style={{ height: 12 }} />

      {/* Marks trend + attendance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        <Section title="Score Trend (all assessments)">
          {marksTimeline.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No marks recorded yet</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "#888780" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.teal }} /> ≥ 75%
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.amber }} /> 50–74%
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.coral }} /> &lt; 50%
                </span>
              </div>
              <div style={{ height: 200 }}>
                <Line data={marksLineData} options={{
                  ...baseOptions,
                  scales: {
                    ...baseOptions.scales,
                    y: { ...baseOptions.scales.y, min: 0, max: 100, ticks: { ...baseOptions.scales.y.ticks, callback: (v) => `${v}%` } },
                  },
                  plugins: {
                    ...baseOptions.plugins, tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const m = marksTimeline[ctx.dataIndex]
                          return ` ${m.obtained} / ${m.total} (${m.percentage}%)`
                        },
                      }
                    }
                  },
                }} />
              </div>
            </>
          )}
        </Section>

        <Section title="Attendance per Course">
          {attendanceByCourse.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No attendance recorded yet</p>
          ) : (
            <>
              <div style={{ height: 200 }}>
                <Bar data={attendanceBarData} options={{
                  ...baseOptions,
                  indexAxis: "y",
                  scales: {
                    x: { grid: { color: "rgba(136,135,128,0.12)" }, max: 100, ticks: { color: "#888780", font: { size: 11 }, callback: (v) => `${v}%` } },
                    y: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 } } },
                  },
                }} />
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {attendanceByCourse.map((c) => (
                  <div key={c.name} style={{ fontSize: 12, color: "#888780" }}>
                    <span style={{ color: "rgb(var(--text))", fontWeight: 500 }}>{c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name}:</span>{" "}
                    {c.present}/{c.total} classes
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

      </div>

      {/* Marks details table */}
      <Section title="Assessment Breakdown">
        {marksTimeline.length === 0 ? (
          <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No assessments yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Assessment", "Type", "Scored", "Out of", "Score %", "Date"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "8px 12px",
                      color: "#888780", fontWeight: 500,
                      borderBottom: "0.5px solid rgba(136,135,128,0.2)",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marksTimeline.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "0.5px solid rgba(136,135,128,0.08)" }}>
                    <td style={{ padding: "10px 12px", color: "rgb(var(--text))", fontWeight: 500 }}>{m.title}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: (TYPE_COLORS[m.type] || "#888780") + "20",
                        color: TYPE_COLORS[m.type] || "#888780",
                        padding: "2px 8px", borderRadius: 4, fontSize: 11,
                      }}>{m.type}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgb(var(--text))", fontWeight: 600 }}>{m.obtained}</td>
                    <td style={{ padding: "10px 12px", color: "#888780" }}>{m.total}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: "rgba(136,135,128,0.15)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${m.percentage}%`,
                            background: m.percentage >= 75 ? COLORS.teal : m.percentage >= 50 ? COLORS.amber : COLORS.coral,
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: m.percentage >= 75 ? COLORS.teal : m.percentage >= 50 ? COLORS.amber : COLORS.coral,
                        }}>{m.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#888780", whiteSpace: "nowrap" }}>
                      {new Date(m.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

    </div>
  )
}