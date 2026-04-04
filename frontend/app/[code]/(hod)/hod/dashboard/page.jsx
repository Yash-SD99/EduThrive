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
  pink:   "#D4537E",
  gray:   "#888780",
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

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 }, maxRotation: 30 } },
    y: { grid: { color: "rgba(136,135,128,0.12)" }, ticks: { color: "#888780", font: { size: 11 } } },
  },
}

// Horizontal bar options (no y-axis grid lines, x-axis grid lines instead)
const hBarOptions = {
  ...baseOptions,
  indexAxis: "y",
  scales: {
    x: { grid: { color: "rgba(136,135,128,0.12)" }, ticks: { color: "#888780", font: { size: 11 } } },
    y: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 } } },
  },
}

export default function HodDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/hod`, { credentials: "include" })
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
            width: 40, height: 40, border: `3px solid rgba(31,158,117,0.2)`,
            borderTopColor: COLORS.teal, borderRadius: "50%",
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
    summary, enrollmentPerCourse, avgMarksByCourse,
    attendanceByCourse, assessmentTypes,
  } = data

  // Chart data
  const enrollmentChart = {
    labels: enrollmentPerCourse.map((c) => c.name.length > 18 ? c.name.substring(0, 16) + "…" : c.name),
    datasets: [{
      data: enrollmentPerCourse.map((c) => c.count),
      backgroundColor: enrollmentPerCourse.map((_, i) => COLOR_LIST[i % COLOR_LIST.length]),
      borderRadius: 6,
      borderWidth: 0,
    }],
  }

  const marksChart = {
    labels: avgMarksByCourse.map((c) => c.name.length > 18 ? c.name.substring(0, 16) + "…" : c.name),
    datasets: [{
      label: "Avg Score",
      data: avgMarksByCourse.map((c) => c.avgScore),
      backgroundColor: avgMarksByCourse.map((_, i) => COLOR_LIST[i % COLOR_LIST.length] + "cc"),
      borderRadius: 6,
      borderWidth: 0,
    }],
  }

  const attendanceChart = {
    labels: attendanceByCourse.map((c) => c.name.length > 18 ? c.name.substring(0, 16) + "…" : c.name),
    datasets: [{
      label: "Attendance %",
      data: attendanceByCourse.map((c) => c.percentage),
      backgroundColor: attendanceByCourse.map((c) =>
        c.percentage >= 75 ? COLORS.teal + "cc" : COLORS.coral + "cc"
      ),
      borderRadius: 6,
      borderWidth: 0,
    }],
  }

  const doughnutData = {
    labels: assessmentTypes.map((t) => t._id),
    datasets: [{
      data: assessmentTypes.map((t) => t.count),
      backgroundColor: assessmentTypes.map((t) => ASSESSMENT_COLORS[t._id] || COLORS.gray),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  return (
    <div style={{ padding: "4px 2px 24px", maxWidth: 1200 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 4 }}>
          Department Analytics
        </h1>
        <p style={{ fontSize: 14, color: "#888780" }}>Performance overview for your department</p>
      </div>

      <div className="mb-[24px]">
        <AlertPanel role="hod" title="Department Alerts" />
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Courses" value={summary.totalCourses} color={COLORS.blue} />
        <StatCard label="Teachers" value={summary.totalTeachers} color={COLORS.teal} />
        <StatCard label="Students" value={summary.totalStudents} color={COLORS.purple} />
        <StatCard label="Sections" value={summary.totalSections} color={COLORS.amber} />
      </div>

      {/* Row 1: enrollment + marks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Section title="Enrollment per Course">
          {enrollmentPerCourse.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No enrollment data yet</p>
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={enrollmentChart} options={{
                ...hBarOptions,
                plugins: { ...hBarOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} students` } } },
              }} />
            </div>
          )}
        </Section>

        <Section title="Avg Marks per Course">
          {avgMarksByCourse.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No assessment data yet</p>
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={marksChart} options={{
                ...hBarOptions,
                scales: {
                  ...hBarOptions.scales,
                  x: { ...hBarOptions.scales.x, max: 100, ticks: { ...hBarOptions.scales.x.ticks, callback: (v) => v } },
                },
                plugins: { ...hBarOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} avg score` } } },
              }} />
            </div>
          )}
        </Section>
      </div>

      {/* Row 2: attendance + assessment types */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Section title="Attendance % per Course">
          {attendanceByCourse.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No attendance data yet</p>
          ) : (
            <>
              {/* Legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "#888780" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.teal }} />
                  ≥ 75% (good)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.coral }} />
                  &lt; 75% (low)
                </span>
              </div>
              <div style={{ height: 220 }}>
                <Bar data={attendanceChart} options={{
                  ...hBarOptions,
                  scales: {
                    ...hBarOptions.scales,
                    x: { ...hBarOptions.scales.x, max: 100, ticks: { ...hBarOptions.scales.x.ticks, callback: (v) => `${v}%` } },
                  },
                  plugins: { ...hBarOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}%` } } },
                }} />
              </div>
            </>
          )}
        </Section>

        <Section title="Assessment Types">
          {assessmentTypes.length === 0 ? (
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
                {assessmentTypes.map((t) => (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: ASSESSMENT_COLORS[t._id] || COLORS.gray, flexShrink: 0 }} />
                    <span style={{ color: "rgb(var(--text))", flex: 1 }}>{t._id}</span>
                    <span style={{
                      background: "rgba(136,135,128,0.1)", color: "#888780",
                      padding: "2px 8px", borderRadius: 4, fontSize: 12,
                    }}>{t.count}</span>
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