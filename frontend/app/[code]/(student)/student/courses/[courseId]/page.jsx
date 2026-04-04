"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import Button from "@/components/ui/Button"
import { ArrowBigLeft } from "lucide-react"

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

// ─────────────────────────────────────────────────────────────
//  Design tokens
// ─────────────────────────────────────────────────────────────
const C = {
  blue:   "#378ADD",
  teal:   "#1D9E75",
  amber:  "#EF9F27",
  coral:  "#D85A30",
  purple: "#7F77DD",
  green:  "#639922",
  pink:   "#D4537E",
  gray:   "#888780",
}

const TYPE_COLOR = {
  Assignment: C.blue,
  Quiz:       C.teal,
  Midterm:    C.amber,
  Final:      C.coral,
}

const scoreColor = (pct) => {
  if (pct === null || pct === undefined) return C.gray
  if (pct >= 75) return C.teal
  if (pct >= 50) return C.amber
  return C.coral
}

const scoreLabel = (pct) => {
  if (pct === null || pct === undefined) return "—"
  if (pct >= 85) return "Excellent"
  if (pct >= 75) return "Good"
  if (pct >= 50) return "Average"
  return "Needs Work"
}

const INSIGHT_ICON  = { positive: "↑", warning: "↓", neutral: "→", info: "•" }
const INSIGHT_COLOR = { positive: C.teal, warning: C.coral, neutral: C.gray, info: C.blue }

// ─────────────────────────────────────────────────────────────
//  Reusable UI atoms
// ─────────────────────────────────────────────────────────────

function RingMeter({ pct, size = 80, stroke = 7, color, label, sub }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, pct ?? 0)) / 100) * circ
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(136,135,128,0.15)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 70 ? 16 : 13, fontWeight: 700, color: "rgb(var(--text))" }}>
            {pct !== null && pct !== undefined ? `${pct}%` : "—"}
          </span>
        </div>
      </div>
      {label && <span style={{ fontSize: 11, color: C.gray, textAlign: "center", lineHeight: 1.3 }}>{label}</span>}
      {sub   && <span style={{ fontSize: 10, color: scoreColor(pct), fontWeight: 600 }}>{sub}</span>}
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: `${color}12`, border: `0.5px solid ${color}40`,
      borderRadius: 10, padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: "rgb(var(--text))" }}>{value}</span>
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "0.5px solid rgba(136,135,128,0.18)",
      borderRadius: 14, padding: "18px 20px",
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, color: C.gray,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16,
    }}>{children}</p>
  )
}

function Tab({ label, active, onClick, accent = C.blue }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", border: "none", borderRadius: 8,
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
      background: active ? `${accent}18` : "transparent",
      color: active ? accent : C.gray,
      borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
      transition: "all 0.15s ease",
    }}>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
//  Grade Card — the main new component
// ─────────────────────────────────────────────────────────────
function GradeCard({ gradeCard, policy }) {
  if (!gradeCard) return null

  const { isFullGrade, finalGrade, partialGrade, coveredWeightage,
          remainingWeightage, typeContributions, missingFor,
          isPassing, bestCaseGrade, canPassIfPerfect, passingMarks } = gradeCard

  const displayGrade   = isFullGrade ? finalGrade : partialGrade
  const gradeColor     = isFullGrade
    ? (isPassing ? (finalGrade >= 75 ? C.teal : C.amber) : C.coral)
    : C.purple   // purple = partial / in-progress

  // Letter grade helper
  const letterGrade = (g) => {
    if (g === null) return "—"
    if (g >= 90) return "A+"
    if (g >= 80) return "A"
    if (g >= 70) return "B"
    if (g >= 60) return "C"
    if (g >= passingMarks) return "D"
    return "F"
  }

  return (
    <Card style={{ borderTop: `3px solid ${gradeColor}` }}>
      <CardTitle>{isFullGrade ? "Final Grade" : "Grade in Progress"}</CardTitle>

      {/* Top row: big grade number + status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

        {/* Grade display */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
            {displayGrade}%
          </span>
          <span style={{
            fontSize: 22, fontWeight: 700,
            color: gradeColor, opacity: 0.7,
          }}>
            {isFullGrade ? letterGrade(finalGrade) : letterGrade(partialGrade)}
          </span>
        </div>

        {/* Status badge stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {isFullGrade ? (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
              background: isPassing ? `${C.teal}18` : `${C.coral}18`,
              color: isPassing ? C.teal : C.coral,
              border: `0.5px solid ${isPassing ? C.teal : C.coral}40`,
            }}>
              {isPassing ? "✓ Passing" : "✗ Failing"} — threshold {passingMarks}%
            </span>
          ) : (
            <>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                background: `${C.purple}18`, color: C.purple,
                border: `0.5px solid ${C.purple}40`,
              }}>
                ◌ Partial — {coveredWeightage}% of course graded
              </span>
              {missingFor.length > 0 && (
                <span style={{ fontSize: 11, color: C.gray }}>
                  Awaiting: {missingFor.join(" & ")} to finalise grade
                </span>
              )}
              {bestCaseGrade !== undefined && (
                <span style={{
                  fontSize: 11, color: canPassIfPerfect ? C.teal : C.coral,
                  fontWeight: 500,
                }}>
                  {canPassIfPerfect
                    ? `Max possible grade: ${bestCaseGrade}%`
                    : `Max possible grade: ${bestCaseGrade}% — cannot reach ${passingMarks}% passing`}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Per-type breakdown table */}
      <div style={{ borderTop: "0.5px solid rgba(136,135,128,0.15)", paddingTop: 14 }}>
        <p style={{ fontSize: 11, color: C.gray, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Weightage Breakdown
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {typeContributions.map((tc) => (
            <div key={tc.type}>
              {/* Row header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: tc.status === "graded" ? TYPE_COLOR[tc.type] : "rgba(136,135,128,0.3)",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: "rgb(var(--text))", flex: 1, fontWeight: 500 }}>
                  {tc.type}
                </span>

                {/* Weight badge */}
                <span style={{
                  fontSize: 11, padding: "1px 6px", borderRadius: 4,
                  background: "rgba(136,135,128,0.1)", color: C.gray,
                }}>
                  {tc.weightage}% weight
                </span>

                {/* Contribution */}
                {tc.status === "graded" ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(tc.avgPct), minWidth: 90, textAlign: "right" }}>
                    {tc.weightedScore} / {tc.maxWeightedScore} pts
                  </span>
                ) : tc.status === "pending" ? (
                  <span style={{ fontSize: 12, color: C.amber, minWidth: 90, textAlign: "right" }}>Pending grade</span>
                ) : (
                  <span style={{ fontSize: 12, color: C.gray, fontStyle: "italic", minWidth: 90, textAlign: "right" }}>No assessments</span>
                )}
              </div>

              {/* Progress bar — shows weighted contribution as fraction of full weight */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  flex: 1, height: 6,
                  background: "rgba(136,135,128,0.1)",
                  borderRadius: 3, overflow: "hidden",
                }}>
                  {tc.status === "graded" && (
                    <div style={{
                      height: "100%",
                      // fill = (weightedScore / maxWeightedScore) * 100
                      width: `${tc.maxWeightedScore > 0 ? (tc.weightedScore / tc.maxWeightedScore) * 100 : 0}%`,
                      background: TYPE_COLOR[tc.type],
                      borderRadius: 3,
                      transition: "width 0.8s ease",
                    }} />
                  )}
                  {tc.status === "pending" && (
                    // Dashed "potential" bar to show what this type *could* contribute
                    <div style={{
                      height: "100%", width: "100%",
                      background: `repeating-linear-gradient(90deg, ${C.amber}40 0px, ${C.amber}40 6px, transparent 6px, transparent 12px)`,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 11, color: C.gray, whiteSpace: "nowrap", minWidth: 70, textAlign: "right" }}>
                  {tc.status === "graded"
                    ? `${tc.avgPct}% avg · ${tc.graded}/${tc.total} done`
                    : tc.status === "pending"
                    ? `${tc.total} assessment${tc.total > 1 ? "s" : ""} pending`
                    : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 14, paddingTop: 12,
          borderTop: "0.5px solid rgba(136,135,128,0.15)",
        }}>
          <span style={{ fontSize: 13, color: C.gray }}>
            {isFullGrade ? "Final grade (100%)" : `So far (${coveredWeightage}% of course)`}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: gradeColor }}>
            {displayGrade}%
            {!isFullGrade && remainingWeightage > 0 && (
              <span style={{ fontSize: 12, color: C.gray, fontWeight: 400, marginLeft: 8 }}>
                + up to {remainingWeightage}% remaining
              </span>
            )}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
//  Attendance calendar heatmap
// ─────────────────────────────────────────────────────────────
function AttendanceCalendar({ records }) {
  if (!records || records.length === 0)
    return <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No records yet</p>

  const byMonth = {}
  for (const r of records) {
    const d   = new Date(r.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push({ day: d.getDate(), status: r.status })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(byMonth).map(([monthKey, days]) => {
        const [yr, mo]   = monthKey.split("-").map(Number)
        const monthName  = new Date(yr, mo - 1).toLocaleString("default", { month: "long", year: "numeric" })
        const daysInMonth = new Date(yr, mo, 0).getDate()
        return (
          <div key={monthKey}>
            <p style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{monthName}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const rec = days.find((x) => x.day === d)
                const bg  = rec ? (rec.status === "present" ? C.teal : C.coral) : "rgba(136,135,128,0.1)"
                return (
                  <div key={d} title={rec ? `Day ${d}: ${rec.status}` : `Day ${d}: no class`} style={{
                    width: 18, height: 18, borderRadius: 3,
                    background: bg, opacity: rec ? 1 : 0.4,
                    cursor: rec ? "pointer" : "default",
                  }} />
                )
              })}
            </div>
          </div>
        )
      })}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.gray }}>
        {[
          { color: C.teal,                       label: "Present" },
          { color: C.coral,                       label: "Absent"  },
          { color: "rgba(136,135,128,0.2)", label: "No class" },
        ].map((l) => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────────────────────
export default function CourseDetail() {
  const { courseId } = useParams()
  const router       = useRouter()

  const [activeTab, setActiveTab] = useState("analytics")
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [course,    setCourse]    = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem("selectedCourse")
    if (stored) setCourse(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/courses/${courseId}/course-analytics`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message)
        setAnalytics(json.data)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 44, height: 44,
            border: `3px solid rgba(55,138,221,0.15)`, borderTopColor: C.blue,
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
            margin: "0 auto 14px",
          }} />
          <p style={{ color: C.gray, fontSize: 14 }}>Loading course analytics…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!analytics) return null

  const {
    courseInfo, hasData,
    gradeCard, policy,
    assessmentComparison, typeBreakdown,
    attendanceSummary, performanceTrend, insights,
  } = analytics

  const att                = attendanceSummary
  const attendanceThreshold = policy?.attendanceThreshold ?? 75
  const passingMarks        = policy?.passingMarks        ?? 40
  const gradedItems         = assessmentComparison.filter((a) => a.myScore !== null)

  // Header ring: show weighted partial/final grade, fall back to plain avg
  const overallPct = gradeCard?.isFullGrade
    ? gradeCard.finalGrade
    : (gradeCard?.partialGrade ?? (
        gradedItems.length > 0
          ? Math.round(gradedItems.reduce((s, a) => s + a.myPct, 0) / gradedItems.length)
          : null
      ))

  // ── Chart data ───────────────────────────────────────────────

  const trendData = {
    labels: performanceTrend.map((p) => p.title),
    datasets: [
      {
        label: "My Score %",
        data: performanceTrend.map((p) => p.myPct),
        borderColor: C.purple, backgroundColor: `${C.purple}12`,
        fill: true, tension: 0.4,
        pointBackgroundColor: performanceTrend.map((p) => scoreColor(p.myPct)),
        pointRadius: 5, pointHoverRadius: 7,
      },
      {
        label: "Class Avg %",
        data: performanceTrend.map((p) => p.avgPct),
        borderColor: C.gray, borderDash: [5, 4],
        backgroundColor: "transparent", tension: 0.4,
        pointBackgroundColor: C.gray, pointRadius: 3,
      },
    ],
  }

  const typeWithData  = typeBreakdown.filter((t) => t.avgPct !== null)
  const typeDoughnut = {
    labels: typeWithData.map((t) => t.type),
    datasets: [{
      data: typeWithData.map((t) => t.avgPct),
      backgroundColor: typeWithData.map((t) => TYPE_COLOR[t.type] || C.gray),
      borderWidth: 0, hoverOffset: 6,
    }],
  }

  const compData = {
    labels: gradedItems.map((a) => a.title.length > 12 ? a.title.substring(0, 10) + "…" : a.title),
    datasets: [
      {
        label: "My Score %",
        data: gradedItems.map((a) => a.myPct),
        backgroundColor: C.purple + "cc", borderRadius: 4, borderWidth: 0,
      },
      {
        label: "Class Avg %",
        data: gradedItems.map((a) => a.avgPct ?? 0),
        backgroundColor: C.gray + "50", borderRadius: 4, borderWidth: 0,
      },
      {
        label: "Class Best %",
        data: gradedItems.map((a) => a.highPct ?? 0),
        backgroundColor: C.teal + "40", borderRadius: 4, borderWidth: 0,
      },
    ],
  }

  const chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.gray, font: { size: 11 } } },
      y: {
        grid: { color: "rgba(136,135,128,0.1)" },
        ticks: { color: C.gray, font: { size: 11 }, callback: (v) => `${v}%` },
        max: 100, min: 0,
      },
    },
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <Button size="md" onClick={() => router.back()} className="mb-[14px]" leftIcon={<ArrowBigLeft/>}>
            Back to courses
        </Button>

        <Card style={{ borderLeft: `4px solid ${C.blue}`, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "rgb(var(--text))", margin: 0 }}>
                  {courseInfo.name || course?.course?.name || "Course"}
                </h1>
                <span style={{
                  background: `${C.blue}18`, color: C.blue,
                  fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                }}>
                  {courseInfo.code || course?.course?.code}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.gray, flexWrap: "wrap" }}>
                {courseInfo.credits       && <span>{courseInfo.credits} Credits</span>}
                {courseInfo.semester      && <span>Semester {courseInfo.semester}</span>}
                {courseInfo.section       && <span>Section {courseInfo.section}</span>}
                {courseInfo.totalStudents > 0 && <span>{courseInfo.totalStudents} in class</span>}
                {policy && (
                  <span style={{ color: C.amber }}>
                    Passing: {passingMarks}% · Attendance: {attendanceThreshold}%
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <RingMeter
                pct={overallPct}
                size={78} stroke={6}
                color={gradeCard?.isFullGrade
                  ? (gradeCard.isPassing ? scoreColor(overallPct) : C.coral)
                  : C.purple}
                label={gradeCard?.isFullGrade ? "Final grade" : "So far"}
                sub={gradeCard?.isFullGrade ? scoreLabel(overallPct) : `${gradeCard?.coveredWeightage ?? 0}% graded`}
              />
              <RingMeter
                pct={att.percentage}
                size={78} stroke={6}
                color={att.percentage >= attendanceThreshold ? C.teal : C.coral}
                label="Attendance"
                sub={att.percentage >= attendanceThreshold ? "Good" : "Low!"}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 20,
        borderBottom: "0.5px solid rgba(136,135,128,0.18)", paddingBottom: 2,
      }}>
        <Tab label="Analytics"  active={activeTab === "analytics"}  onClick={() => setActiveTab("analytics")}  accent={C.purple} />
        <Tab label="Marks"      active={activeTab === "marks"}      onClick={() => setActiveTab("marks")}      accent={C.blue} />
        <Tab label="Attendance" active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} accent={C.teal} />
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: ANALYTICS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {!hasData ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px 0", color: C.gray }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
                <p style={{ fontSize: 15, fontWeight: 500 }}>No assessment data yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Analytics will appear once your teacher grades assessments.</p>
              </div>
            </Card>
          ) : (
            <>
              {/* ── Grade Card — most prominent ── */}
              <GradeCard gradeCard={gradeCard} policy={policy} />

              {/* ── Insights ── */}
              {insights.length > 0 && (
                <Card>
                  <CardTitle>Insights</CardTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {insights.map((ins, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        padding: "10px 12px",
                        background: `${INSIGHT_COLOR[ins.type]}10`,
                        borderLeft: `3px solid ${INSIGHT_COLOR[ins.type]}`,
                        borderRadius: "0 8px 8px 0",
                      }}>
                        <span style={{ fontSize: 14, color: INSIGHT_COLOR[ins.type], fontWeight: 700, flexShrink: 0 }}>
                          {INSIGHT_ICON[ins.type]}
                        </span>
                        <span style={{ fontSize: 13, color: "rgb(var(--text))", lineHeight: 1.5 }}>{ins.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Summary pills ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                <StatPill label="Graded" value={`${gradedItems.length} / ${assessmentComparison.length}`} color={C.purple} />
                <StatPill
                  label="Beat Class Avg"
                  value={`${gradedItems.filter((a) => a.avgPct !== null && a.myPct > a.avgPct).length} / ${gradedItems.filter((a) => a.avgPct !== null).length}`}
                  color={C.teal}
                />
                <StatPill label="Current Streak" value={`${att.currentStreak}d`} color={att.currentStreak >= 5 ? C.teal : C.amber} />
                <StatPill label="Best Streak"    value={`${att.longestStreak}d`} color={C.blue} />
              </div>

              {/* ── Score trend vs class avg ── */}
              {performanceTrend.length >= 2 && (
                <Card>
                  <CardTitle>Score Trend vs Class Average</CardTitle>
                  <div style={{ display: "flex", gap: 20, marginBottom: 14, fontSize: 12, color: C.gray, flexWrap: "wrap" }}>
                    {[
                      { line: C.purple, dash: false, label: "My score" },
                      { line: C.gray,   dash: true,  label: "Class avg" },
                    ].map((l) => (
                      <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 20, height: 2, background: l.line, display: "inline-block",
                          borderRadius: 1,
                          ...(l.dash ? { backgroundImage: `repeating-linear-gradient(90deg,${C.gray} 0,${C.gray} 4px,transparent 4px,transparent 8px)`, background: "none" } : {}),
                        }} />
                        {l.label}
                      </span>
                    ))}
                    {[
                      { color: C.teal,  label: `≥${passingMarks > 50 ? 75 : 75}%` },
                      { color: C.amber, label: "50–74%"   },
                      { color: C.coral, label: "<50%"     },
                    ].map((l) => (
                      <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ height: 220 }}>
                    <Line data={trendData} options={{
                      ...chartBase,
                      plugins: { ...chartBase.plugins, tooltip: {
                        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` },
                      }},
                    }} />
                  </div>
                </Card>
              )}

              {/* ── You vs class grouped bars ── */}
              {gradedItems.length > 0 && (
                <Card>
                  <CardTitle>You vs Class — Per Assessment</CardTitle>
                  <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12, color: C.gray, flexWrap: "wrap" }}>
                    {[
                      { color: C.purple + "cc", label: "My score"   },
                      { color: C.gray   + "50", label: "Class avg"  },
                      { color: C.teal   + "40", label: "Class best" },
                    ].map((l) => (
                      <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ height: 220 }}>
                    <Bar data={compData} options={{
                      ...chartBase,
                      plugins: { ...chartBase.plugins, tooltip: {
                        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` },
                      }},
                    }} />
                  </div>
                </Card>
              )}

              {/* ── Type breakdown + Rank table ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                <Card>
                  <CardTitle>Avg Score by Assessment Type</CardTitle>
                  {typeWithData.length === 0 ? (
                    <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "30px 0" }}>No graded data</p>
                  ) : (
                    <>
                      <div style={{ height: 150, marginBottom: 14 }}>
                        <Doughnut data={typeDoughnut} options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: false } }, cutout: "60%",
                        }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {typeWithData.map((t) => (
                          <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLOR[t.type] || C.gray, flexShrink: 0 }} />
                            <span style={{ flex: 1, color: "rgb(var(--text))" }}>{t.type}</span>
                            <span style={{ fontSize: 10, color: C.gray }}>w: {t.weightage}%</span>
                            <span style={{ fontWeight: 600, color: scoreColor(t.avgPct) }}>{t.avgPct}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                <Card>
                  <CardTitle>Class Rank per Assessment</CardTitle>
                  {gradedItems.filter((a) => a.rank !== null).length === 0 ? (
                    <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "30px 0" }}>No rank data yet</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {gradedItems.filter((a) => a.rank !== null).map((a) => (
                        <div key={a.assessmentId.toString()} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: a.rank === 1 ? C.amber + "30" : a.rank <= 3 ? C.teal + "20" : "rgba(136,135,128,0.12)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                            color: a.rank === 1 ? C.amber : a.rank <= 3 ? C.teal : C.gray,
                            flexShrink: 0,
                          }}>
                            {a.rank === 1 ? "🥇" : a.rank === 2 ? "🥈" : a.rank === 3 ? "🥉" : `#${a.rank}`}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, color: "rgb(var(--text))", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.title}
                            </p>
                            <p style={{ fontSize: 11, color: C.gray, margin: 0 }}>
                              #{a.rank} of {a.totalRanked} · {a.myPct}%
                            </p>
                          </div>
                          <span style={{
                            padding: "2px 7px", borderRadius: 5, fontSize: 11,
                            background: `${TYPE_COLOR[a.type] || C.gray}18`,
                            color: TYPE_COLOR[a.type] || C.gray,
                          }}>{a.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: MARKS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "marks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Compact grade summary at top of marks tab */}
          {gradeCard && hasData && (
            <Card style={{
              borderTop: `3px solid ${gradeCard.isFullGrade
                ? (gradeCard.isPassing ? C.teal : C.coral)
                : C.purple}`,
              padding: "14px 18px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.gray, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {gradeCard.isFullGrade ? "Final Weighted Grade" : "Weighted Grade (partial)"}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{
                      fontSize: 28, fontWeight: 800,
                      color: gradeCard.isFullGrade
                        ? (gradeCard.isPassing ? scoreColor(gradeCard.finalGrade) : C.coral)
                        : C.purple,
                    }}>
                      {gradeCard.isFullGrade ? gradeCard.finalGrade : gradeCard.partialGrade}%
                    </span>
                    {!gradeCard.isFullGrade && (
                      <span style={{ fontSize: 12, color: C.gray }}>
                        from {gradeCard.coveredWeightage}% of course · awaiting {gradeCard.missingFor.join(" & ")}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {gradeCard.typeContributions.filter((tc) => tc.status === "graded").map((tc) => (
                    <div key={tc.type} style={{
                      textAlign: "center", padding: "8px 12px",
                      background: `${TYPE_COLOR[tc.type]}10`,
                      border: `0.5px solid ${TYPE_COLOR[tc.type]}30`,
                      borderRadius: 8,
                    }}>
                      <p style={{ fontSize: 10, color: C.gray, margin: "0 0 2px" }}>{tc.type} ({tc.weightage}%)</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: TYPE_COLOR[tc.type], margin: 0 }}>
                        {tc.weightedScore}/{tc.maxWeightedScore}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {assessmentComparison.length === 0 ? (
            <Card>
              <p style={{ color: C.gray, textAlign: "center", padding: "40px 0", fontSize: 14 }}>No assessments yet</p>
            </Card>
          ) : (
            assessmentComparison.map((a) => (
              <Card key={a.assessmentId.toString()} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "rgb(var(--text))" }}>{a.title}</span>
                      <span style={{
                        fontSize: 11, padding: "2px 7px", borderRadius: 5,
                        background: `${TYPE_COLOR[a.type] || C.gray}18`,
                        color: TYPE_COLOR[a.type] || C.gray, fontWeight: 600,
                      }}>{a.type}</span>
                      {/* Weight badge */}
                      <span style={{
                        fontSize: 10, padding: "2px 6px", borderRadius: 4,
                        background: "rgba(136,135,128,0.1)", color: C.gray,
                      }}>
                        contributes {a.thisAssessmentWeightShare}% to grade
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: C.gray, margin: 0 }}>
                      {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {a.myScore !== null ? (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(a.myPct) }}>{a.myScore}</span>
                        <span style={{ fontSize: 14, color: C.gray }}>/ {a.totalMarks}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", marginTop: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(a.myPct) }}>{a.myPct}%</span>
                        {a.myWeightedContrib !== null && (
                          <span style={{ fontSize: 11, color: C.gray }}>
                            → {a.myWeightedContrib}/{a.maxWeightedContrib} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: C.gray, fontStyle: "italic" }}>Not graded</span>
                  )}
                </div>

                {a.myScore !== null && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "You",        pct: a.myPct,  color: C.purple },
                      { label: "Class avg",  pct: a.avgPct, color: C.gray   },
                      { label: "Class best", pct: a.highPct, color: C.teal  },
                    ].map((row) => row.pct !== null && (
                      <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.gray, width: 58, flexShrink: 0 }}>{row.label}</span>
                        <div style={{ flex: 1, height: 6, background: "rgba(136,135,128,0.12)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${row.pct}%`,
                            background: row.color, borderRadius: 3,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: row.color, fontWeight: 600, width: 34, textAlign: "right", flexShrink: 0 }}>
                          {row.pct}%
                        </span>
                      </div>
                    ))}
                    {a.rank !== null && (
                      <p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>
                        Rank <strong style={{ color: a.rank <= 3 ? C.teal : "rgb(var(--text))" }}>{a.rank}</strong> of {a.totalRanked} students
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: ATTENDANCE
      ══════════════════════════════════════════════════════ */}
      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            <StatPill label="Total Classes"   value={att.total}             color={C.blue}  />
            <StatPill label="Present"         value={att.present}           color={C.teal}  />
            <StatPill label="Absent"          value={att.absent}            color={C.coral} />
            <StatPill label="Percentage"      value={`${att.percentage}%`}  color={att.percentage >= attendanceThreshold ? C.teal : C.coral} />
            <StatPill label="Current Streak"  value={`${att.currentStreak}d`} color={C.amber}  />
            <StatPill label="Best Streak"     value={`${att.longestStreak}d`} color={C.purple} />
          </div>

          {/* Policy-aware eligibility warning */}
          {att.total > 0 && att.percentage < attendanceThreshold && (
            <div style={{
              background: `${C.coral}12`, border: `0.5px solid ${C.coral}40`,
              borderLeft: `4px solid ${C.coral}`, borderRadius: "0 10px 10px 0",
              padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.coral, margin: 0 }}>
                  Attendance Below {attendanceThreshold}%
                </p>
                <p style={{ fontSize: 12, color: C.gray, margin: "4px 0 0" }}>
                  You need at least{" "}
                  <strong style={{ color: "rgb(var(--text))" }}>
                    {Math.max(0, Math.ceil(attendanceThreshold / 100 * (att.total + 20) - att.present))}
                  </strong>{" "}
                  consecutive present classes (out of next 20) to recover above {attendanceThreshold}%.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, alignItems: "start" }}>
            <Card>
              <CardTitle>Overview</CardTitle>
              <div style={{ height: 120, marginBottom: 12 }}>
                <Doughnut
                  data={{
                    labels: ["Present", "Absent"],
                    datasets: [{
                      data: [att.present, att.absent],
                      backgroundColor: [C.teal, C.coral],
                      borderWidth: 0, hoverOffset: 4,
                    }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } }, cutout: "65%",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                {[
                  { color: C.teal,  label: "Present", val: att.present },
                  { color: C.coral, label: "Absent",  val: att.absent  },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: r.color }} />
                    <span style={{ color: "rgb(var(--text))", flex: 1 }}>{r.label}</span>
                    <span style={{ fontWeight: 700, color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle>Calendar View</CardTitle>
              <AttendanceCalendar records={att.records} />
            </Card>
          </div>

          <Card>
            <CardTitle>Class-by-Class Record</CardTitle>
            {att.records.length === 0 ? (
              <p style={{ color: C.gray, textAlign: "center", padding: "30px 0", fontSize: 13 }}>No records yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[...att.records].reverse().map((r, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < att.records.length - 1 ? "0.5px solid rgba(136,135,128,0.1)" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "rgb(var(--text))" }}>
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: r.status === "present" ? `${C.teal}18` : `${C.coral}18`,
                      color: r.status === "present" ? C.teal : C.coral,
                    }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      )}

    </div>
  )
}