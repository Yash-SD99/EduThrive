"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import AlertPanel from "@/components/ui/AlertPanel"

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

// ─── Palette (works in light & dark alike) ───────────────────
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

// ─── Shared chart defaults ────────────────────────────────────
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#888780", font: { size: 12 } } },
    y: { grid: { color: "rgba(136,135,128,0.12)" }, ticks: { color: "#888780", font: { size: 12 } } },
  },
}

// ─── Stat card ────────────────────────────────────────────────
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

// ─── Section wrapper ──────────────────────────────────────────
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

export default function DirectorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/director`, {
      credentials: "include",
    })
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
            width: 40, height: 40, border: `3px solid rgba(55,138,221,0.2)`,
            borderTopColor: COLORS.blue, borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#888780", fontSize: 14 }}>Loading analytics…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  const { summary, enrollmentByDept, monthlyEnrollments, avgAttendance, deptAvgMarks, topCourses } = data

  // ── Chart datasets ────────────────────────────────────────
  const enrollmentLineData = {
    labels: monthlyEnrollments.map((m) => m.label),
    datasets: [{
      label: "Enrollments",
      data: monthlyEnrollments.map((m) => m.count),
      borderColor: COLORS.blue,
      backgroundColor: "rgba(55,138,221,0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: COLORS.blue,
      pointRadius: 4,
    }],
  }

  const deptEnrollmentData = {
    labels: enrollmentByDept.map((d) => d.name),
    datasets: [{
      data: enrollmentByDept.map((d) => d.count),
      backgroundColor: enrollmentByDept.map((_, i) => COLOR_LIST[i % COLOR_LIST.length]),
      borderRadius: 6,
    }],
  }

  const deptMarksData = {
    labels: deptAvgMarks.map((d) => d.name),
    datasets: [{
      label: "Avg Score",
      data: deptAvgMarks.map((d) => d.avgMarks),
      backgroundColor: deptAvgMarks.map((_, i) => COLOR_LIST[i % COLOR_LIST.length] + "cc"),
      borderRadius: 6,
      borderWidth: 0,
    }],
  }

  const doughnutData = {
    labels: enrollmentByDept.map((d) => d.name),
    datasets: [{
      data: enrollmentByDept.map((d) => d.count),
      backgroundColor: enrollmentByDept.map((_, i) => COLOR_LIST[i % COLOR_LIST.length]),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  return (
    <div style={{ padding: "4px 2px 24px", maxWidth: 1200 }}>

      {/* Headline */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgb(var(--text))", marginBottom: 4 }}>
          Institute Overview
        </h1>
        <p style={{ fontSize: 14, color: "#888780" }}>Analytics across all departments and courses</p>
      </div>
      <div className="mb-[24px]">
        <AlertPanel role="director" title="Institute Alerts" />
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Students" value={summary.totalStudents.toLocaleString()} color={COLORS.blue} />
        <StatCard label="Total Teachers" value={summary.totalTeachers.toLocaleString()} color={COLORS.teal} />
        <StatCard label="Departments" value={summary.totalDepartments.toLocaleString()} color={COLORS.purple} />
        <StatCard label="Courses" value={summary.totalCourses.toLocaleString()} color={COLORS.amber} />
        <StatCard
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          sub="across all sections"
          color={avgAttendance >= 75 ? COLORS.teal : COLORS.coral}
        />
      </div>

      {/* ── Row 1: Enrollment trend + dept breakdown ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        <Section title="Monthly Enrollments (6 months)">
          <div style={{ height: 220 }}>
            <Line
              data={enrollmentLineData}
              options={{
                ...baseOptions,
                plugins: { ...baseOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} students` } } },
              }}
            />
          </div>
        </Section>

        <Section title="Enrollment by Department">
          <div style={{ height: 220 }}>
            <Bar
              data={deptEnrollmentData}
              options={{
                ...baseOptions,
                plugins: { ...baseOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} students` } } },
              }}
            />
          </div>
        </Section>

      </div>

      {/* ── Row 2: Dept avg marks + doughnut + top courses ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>

        <Section title="Avg Marks by Department">
          {deptAvgMarks.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No assessment data yet</p>
          ) : (
            <div style={{ height: 220 }}>
              <Bar
                data={deptMarksData}
                options={{
                  ...baseOptions,
                  scales: {
                    ...baseOptions.scales,
                    y: { ...baseOptions.scales.y, max: 100, ticks: { ...baseOptions.scales.y.ticks, callback: (v) => v } },
                  },
                  plugins: { ...baseOptions.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}% avg score` } } },
                }}
              />
            </div>
          )}
        </Section>

        <Section title="Enrollment Share">
          {enrollmentByDept.length === 0 ? (
            <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No data yet</p>
          ) : (
            <>
              <div style={{ height: 160, marginBottom: 12 }}>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: "65%",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {enrollmentByDept.map((d, i) => (
                  <div key={d._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_LIST[i % COLOR_LIST.length], flexShrink: 0 }} />
                    <span style={{ color: "rgb(var(--text))", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                    <span style={{ color: "#888780" }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

      </div>

      {/* ── Top courses table ── */}
      <Section title="Top 5 Courses by Enrollment">
        {topCourses.length === 0 ? (
          <p style={{ color: "#888780", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No enrollment data yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["#", "Course", "Code", "Students"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#888780", fontWeight: 500, borderBottom: "0.5px solid rgba(136,135,128,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCourses.map((c, i) => (
                  <tr key={c._id} style={{ borderBottom: "0.5px solid rgba(136,135,128,0.1)" }}>
                    <td style={{ padding: "10px 12px", color: "#888780" }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px", color: "rgb(var(--text))", fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: "rgba(55,138,221,0.1)", color: COLORS.blue, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{c.code}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgb(var(--text))", fontWeight: 600 }}>{c.count}</td>
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