"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import AlertPanel from "@/components/ui/AlertPanel"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const COLORS = {
  blue:   "#378ADD",
  teal:   "#1D9E75",
  amber:  "#EF9F27",
  coral:  "#D85A30",
  purple: "#7F77DD",
  green:  "#639922",
}
const COLOR_LIST = Object.values(COLORS)

const ASSESSMENT_COLORS = {
  Assignment: COLORS.blue,
  Quiz:       COLORS.teal,
  Midterm:    COLORS.amber,
  Final:      COLORS.coral,
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

const hBarOptions = {
  responsive: true, maintainAspectRatio: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: "rgba(136,135,128,0.12)" }, ticks: { color: "#888780", font: { size: 11 } } },
    y: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 } } },
  },
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/teacher`, { credentials: "include" })
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
            width: 40, height: 40, border: `3px solid rgba(239,159,39,0.2)`,
            borderTopColor: COLORS.amber, borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#888780", fontSize: 14 }}>Loading analytics…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  const {
    summary, attendancePerSection, avgMarksPerAssessment,
    assessmentTypeBreakdown, sectionCapacityUsage,
  } = data

  // Charts
  const attendanceChart = {
    labels: attendancePerSection.map((s) => s.name.length > 22 ? s.name.substring(0, 20) + "…" : s.name),
    datasets: [{
      label: "Attendance %",
      data: attendancePerSection.map((s) => s.percentage),
      backgroundColor: attendancePerSection.map((s) =>
        s.percentage >= 75 ? COLORS.teal + "cc" : COLORS.coral + "cc"
      ),
      borderRadius: 6, borderWidth: 0,
    }],
  }

  const marksChart = {
    labels: avgMarksPerAssessment.map((a) => a.title),
    datasets: [{
      label: "Score %",
      data: avgMarksPerAssessment.map((a) => a.avg),
      backgroundColor: avgMarksPerAssessment.map((_, i) => COLOR_LIST[i % COLOR_LIST.length] + "cc"),
      borderRadius: 6, borderWidth: 0,
    }],
  }

  const doughnutData = {
    labels: assessmentTypeBreakdown.map((t) => t._id),
    datasets: [{
      data: assessmentTypeBreakdown.map((t) => t.count),
      backgroundColor: assessmentTypeBreakdown.map((t) => ASSESSMENT_COLORS[t._id] || "#888780"),
      borderWidth: 0, hoverOffset: 4,
    }],
  }

  return (
    <div style={{ padding: "4px 2px 24px", maxWidth: 1200 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 4 }}>
          Teaching Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#888780" }}>Performance across all your assigned sections</p>
      </div>

      <div className="mb-[24px]">
        <AlertPanel role="teacher" title="Alerts" />
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Sections" value={summary.totalSections} color={COLORS.purple} />
        <StatCard label="Total Students" value={summary.totalStudents} color={COLORS.blue} />
        <StatCard label="Assessments" value={summary.totalAssessments} color={COLORS.amber} />
        <StatCard
          label="Avg Attendance"
          value={`${summary.avgAttendance}%`}
          sub="across all sections"
          color={summary.avgAttendance >= 75 ? COLORS.teal : COLORS.coral}
        />
      </div>

      {/* Row 1: attendance + marks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        <Section title="Attendance % per Section">
          {attendancePerSection.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No attendance recorded yet</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "#888780" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.teal }} /> ≥ 75%
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.coral }} /> &lt; 75%
                </span>
              </div>
              <div style={{ height: Math.max(180, attendancePerSection.length * 40) }}>
                <Bar data={attendanceChart} options={{
                  ...hBarOptions,
                  scales: {
                    ...hBarOptions.scales,
                    x: { ...hBarOptions.scales.x, max: 100, ticks: { ...hBarOptions.scales.x.ticks, callback: (v) => `${v}%` } },
                  },
                }} />
              </div>
            </>
          )}
        </Section>

        <Section title="Avg Score % per Assessment (recent 8)">
          {avgMarksPerAssessment.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No marks entered yet</p>
          ) : (
            <div style={{ height: Math.max(180, avgMarksPerAssessment.length * 36) }}>
              <Bar data={marksChart} options={{
                ...hBarOptions,
                scales: {
                  ...hBarOptions.scales,
                  x: { ...hBarOptions.scales.x, max: 100, ticks: { ...hBarOptions.scales.x.ticks, callback: (v) => `${v}%` } },
                },
                plugins: { ...hBarOptions.plugins, tooltip: { callbacks: {
                  label: (ctx) => {
                    const a = avgMarksPerAssessment[ctx.dataIndex]
                    return ` ${ctx.raw}% avg (${a.count} students)`
                  },
                }}},
              }} />
            </div>
          )}
        </Section>

      </div>

      {/* Row 2: section capacity + assessment type */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>

        <Section title="Section Capacity Usage">
          {sectionCapacityUsage.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No sections yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sectionCapacityUsage.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "rgb(var(--text))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{s.name}</span>
                    <span style={{ color: "#888780", whiteSpace: "nowrap" }}>{s.enrolled} / {s.capacity}</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(136,135,128,0.15)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${s.percentage}%`,
                      background: s.percentage >= 90 ? COLORS.coral : s.percentage >= 70 ? COLORS.amber : COLORS.teal,
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Assessment Types">
          {assessmentTypeBreakdown.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No assessments yet</p>
          ) : (
            <>
              <div style={{ height: 160, marginBottom: 16 }}>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: "60%",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {assessmentTypeBreakdown.map((t) => (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: ASSESSMENT_COLORS[t._id] || "#888780", flexShrink: 0 }} />
                    <span style={{ color: "rgb(var(--text))", flex: 1 }}>{t._id}</span>
                    <span style={{ background: "rgba(136,135,128,0.1)", color: "#888780", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

      </div>

    </div>
  )
}