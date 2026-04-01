// ─────────────────────────────────────────────────────────────
//  Pure rule engine — zero DB queries.
//  Input:  pre-computed analytics data objects (same shape that
//          the analytics controllers already return).
//  Output: Alert[]  sorted by severity, capped at 7 per role.
//
//  Alert shape:
//  {
//    id:         string           (deterministic, for React keys)
//    role:       "student" | "teacher" | "hod" | "director"
//    level:      "critical" | "warning" | "insight" | "positive"
//    category:   "attendance" | "performance" | "trend" |
//                "rank" | "compliance" | "strategic"
//    scope:      "individual" | "class" | "department" | "institute"
//    message:    string
//    detail:     string | null   (optional sub-text)
//    actionable: boolean
//    meta:       object          (numeric context for UI chips)
//  }
// ─────────────────────────────────────────────────────────────

// ── Severity order (lower index = shown first) ────────────────
const LEVEL_ORDER = { critical: 0, warning: 1, insight: 2, positive: 3 };

// ── Cap & sort ────────────────────────────────────────────────
function finalise(alerts, cap = 7) {
  return alerts
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
    .slice(0, cap);
}

// ── ID helper ─────────────────────────────────────────────────
let _seq = 0;
function id(prefix) { return `${prefix}-${++_seq}`; }

// ─────────────────────────────────────────────────────────────
//  STUDENT ALERTS
//  data shape = courseAnalytics response (data field):
//  { policy, gradeCard, assessmentComparison, attendanceSummary,
//    performanceTrend, typeBreakdown, courseInfo }
// ─────────────────────────────────────────────────────────────
export function generateStudentAlerts(data) {
  const alerts = [];
  if (!data) return alerts;

  const {
    policy,
    gradeCard,
    assessmentComparison = [],
    attendanceSummary:   att     = {},
    performanceTrend:    trend   = [],
    courseInfo = {},
  } = data;

  const threshold   = policy?.attendanceThreshold ?? 75;
  const passing     = policy?.passingMarks        ?? 40;
  const attPct      = att.percentage ?? 0;
  const totalCls    = att.total      ?? 0;
  const presentCls  = att.present    ?? 0;

  const graded = assessmentComparison.filter((a) => a.myScore !== null);

  // ─── ATTENDANCE ───────────────────────────────────────────
  if (totalCls > 0) {
    // Predictive: can student still reach threshold?
    if (attPct < threshold) {
      // How many more classes needed assuming unlimited remaining?
      // present + future = threshold/100 * (total + future)
      // future = (threshold * total / 100 - present) / (1 - threshold/100)
      const ratio        = threshold / 100;
      const neededMore   = ratio === 1 ? Infinity : Math.ceil((ratio * totalCls - presentCls) / (1 - ratio));
      const canRecover   = isFinite(neededMore) && neededMore <= 30; // realistic cap

      if (!canRecover && attPct < threshold) {
        alerts.push({
          id: id("stu-att"),
          role: "student", level: "critical",
          category: "attendance", scope: "individual",
          message: `Attendance cannot reach ${threshold}% even with full future attendance`,
          detail: `Currently ${attPct}% (${presentCls}/${totalCls}). Eligibility at risk.`,
          actionable: false,
          meta: { attPct, threshold },
        });
      } else if (attPct < threshold) {
        alerts.push({
          id: id("stu-att"),
          role: "student", level: "critical",
          category: "attendance", scope: "individual",
          message: `Attendance critically low at ${attPct}% — below the ${threshold}% threshold`,
          detail: `Attend ${neededMore} consecutive classes to recover. Risk of exam bar.`,
          actionable: true,
          meta: { attPct, threshold, neededMore },
        });
      }
    } else if (attPct <= threshold + 5) {
      alerts.push({
        id: id("stu-att"),
        role: "student", level: "warning",
        category: "attendance", scope: "individual",
        message: `Attendance ${attPct}% — only ${Math.round(attPct - threshold)}% above the minimum`,
        detail: "One or two absences could push you below the threshold.",
        actionable: true,
        meta: { attPct, threshold },
      });
    } else if (attPct >= 90) {
      alerts.push({
        id: id("stu-att"),
        role: "student", level: "positive",
        category: "attendance", scope: "individual",
        message: `Excellent attendance at ${attPct}% — well above the ${threshold}% requirement`,
        detail: null,
        actionable: false,
        meta: { attPct },
      });
    }
  }

  // ─── PERFORMANCE ──────────────────────────────────────────
  if (gradeCard) {
    if (gradeCard.isFullGrade) {
      const g = gradeCard.finalGrade;
      if (!gradeCard.isPassing) {
        alerts.push({
          id: id("stu-perf"),
          role: "student", level: "critical",
          category: "performance", scope: "individual",
          message: `Final grade ${g}% is below the passing mark of ${passing}%`,
          detail: "You may need to appear in supplementary examination.",
          actionable: true,
          meta: { grade: g, passing },
        });
      } else if (g - passing <= 5) {
        alerts.push({
          id: id("stu-perf"),
          role: "student", level: "warning",
          category: "performance", scope: "individual",
          message: `Final grade ${g}% is only ${Math.round(g - passing)}% above the passing mark`,
          detail: "Marginal pass — aim to strengthen your performance.",
          actionable: true,
          meta: { grade: g, passing },
        });
      } else if (g >= 75) {
        alerts.push({
          id: id("stu-perf"),
          role: "student", level: "positive",
          category: "performance", scope: "individual",
          message: `Strong final grade of ${g}%${g >= 85 ? " — distinction range" : ""}`,
          detail: null,
          actionable: false,
          meta: { grade: g },
        });
      }
    } else {
      // Partial grade projections
      const bestCase = gradeCard.bestCaseGrade ?? null;
      if (bestCase !== null && bestCase < passing) {
        alerts.push({
          id: id("stu-perf"),
          role: "student", level: "critical",
          category: "performance", scope: "individual",
          message: `Maximum achievable grade is ${bestCase}% — below the ${passing}% passing mark`,
          detail: `Current partial grade: ${gradeCard.partialGrade}%. Even a perfect score on remaining assessments won't be enough.`,
          actionable: true,
          meta: { partialGrade: gradeCard.partialGrade, bestCase, passing },
        });
      } else if (bestCase !== null && gradeCard.partialGrade < passing && gradeCard.partialGrade + 10 < passing) {
        alerts.push({
          id: id("stu-perf"),
          role: "student", level: "warning",
          category: "performance", scope: "individual",
          message: `Projected grade of ${gradeCard.partialGrade}% is within risk range of failing`,
          detail: `You need ${Math.round(passing - gradeCard.partialGrade)} more weighted points from upcoming assessments.`,
          actionable: true,
          meta: { partialGrade: gradeCard.partialGrade, passing },
        });
      }
    }
  }

  // ─── PERFORMANCE vs CLASS ─────────────────────────────────
  if (graded.length > 0) {
    const withAvg   = graded.filter((a) => a.avgPct !== null);
    const myAvgPct  = Math.round(graded.reduce((s, a) => s + a.myPct, 0) / graded.length);
    const classAvgOverall = withAvg.length > 0
      ? Math.round(withAvg.reduce((s, a) => s + a.avgPct, 0) / withAvg.length)
      : null;

    if (classAvgOverall !== null && myAvgPct < classAvgOverall) {
      alerts.push({
        id: id("stu-vs-class"),
        role: "student", level: "insight",
        category: "performance", scope: "individual",
        message: `Your average score (${myAvgPct}%) is below the class average (${classAvgOverall}%)`,
        detail: "Review topics where classmates are performing better.",
        actionable: true,
        meta: { myAvgPct, classAvgOverall },
      });
    }
  }

  // ─── TREND ────────────────────────────────────────────────
  if (trend.length >= 3) {
    // Compare last two assessments' myPct
    const last  = trend[trend.length - 1]?.myPct;
    const prev  = trend[trend.length - 2]?.myPct;
    const prev2 = trend[trend.length - 3]?.myPct;

    if (last !== undefined && prev !== undefined && prev2 !== undefined) {
      const drop1 = prev  - last;  // positive = dropped
      const drop2 = prev2 - prev;  // positive = dropped

      if (drop1 >= 10 && drop2 >= 5) {
        alerts.push({
          id: id("stu-trend"),
          role: "student", level: "warning",
          category: "trend", scope: "individual",
          message: `Declining performance over the last two assessments`,
          detail: `Scores: ${prev2}% → ${prev}% → ${last}%. Consistent downward trend detected.`,
          actionable: true,
          meta: { scores: [prev2, prev, last] },
        });
      } else if (last > prev && prev > prev2) {
        alerts.push({
          id: id("stu-trend"),
          role: "student", level: "positive",
          category: "trend", scope: "individual",
          message: `Continuous improvement across last three assessments`,
          detail: `Scores: ${prev2}% → ${prev}% → ${last}%. Keep the momentum going.`,
          actionable: false,
          meta: { scores: [prev2, prev, last] },
        });
      } else {
        // Variance check: significant fluctuation
        const vals    = trend.map((t) => t.myPct).filter((v) => v !== null);
        const mean    = vals.reduce((s, v) => s + v, 0) / vals.length;
        const stdDev  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
        if (stdDev >= 15) {
          alerts.push({
            id: id("stu-trend"),
            role: "student", level: "insight",
            category: "trend", scope: "individual",
            message: `Performance fluctuating significantly (std dev: ${Math.round(stdDev)}%)`,
            detail: "Inconsistent preparation pattern — consider structured revision.",
            actionable: true,
            meta: { stdDev: Math.round(stdDev) },
          });
        }
      }
    }
  }

  // ─── RANK ─────────────────────────────────────────────────
  const rankedItems = graded.filter((a) => a.rank !== null && a.totalRanked > 0);
  if (rankedItems.length > 0) {
    // Take the most recent ranked assessment
    const recent = rankedItems[rankedItems.length - 1];
    const relRank = recent.rank / recent.totalRanked; // 0 = top, 1 = bottom

    if (recent.rank <= 3) {
      alerts.push({
        id: id("stu-rank"),
        role: "student", level: "positive",
        category: "rank", scope: "individual",
        message: `Ranked #${recent.rank} of ${recent.totalRanked} students in "${recent.title}"`,
        detail: null,
        actionable: false,
        meta: { rank: recent.rank, total: recent.totalRanked },
      });
    } else if (relRank > 0.5) {
      alerts.push({
        id: id("stu-rank"),
        role: "student", level: "insight",
        category: "rank", scope: "individual",
        message: `Above class median — ranked #${recent.rank} of ${recent.totalRanked}`,
        detail: null,
        actionable: false,
        meta: { rank: recent.rank, total: recent.totalRanked },
      });
    } else if (relRank >= 0.8) {
      alerts.push({
        id: id("stu-rank"),
        role: "student", level: "warning",
        category: "rank", scope: "individual",
        message: `Ranked in the bottom 20% — #${recent.rank} of ${recent.totalRanked}`,
        detail: "Focus on catching up before the next assessment.",
        actionable: true,
        meta: { rank: recent.rank, total: recent.totalRanked },
      });
    }
  }

  return finalise(alerts);
}

// ─────────────────────────────────────────────────────────────
//  TEACHER ALERTS
//  data shape = getTeacherAnalytics response (data field):
//  { summary, attendancePerSection, avgMarksPerAssessment,
//    assessmentTypeBreakdown, sectionCapacityUsage }
//  + policy (passed separately from Institute)
// ─────────────────────────────────────────────────────────────
export function generateTeacherAlerts(data, policy = {}) {
  const alerts = [];
  if (!data) return alerts;

  const {
    summary                = {},
    attendancePerSection   = [],
    avgMarksPerAssessment  = [],
    sectionCapacityUsage   = [],
  } = data;

  const threshold = policy.attendanceThreshold ?? 75;
  const passing   = policy.passingMarks        ?? 40;
  const benchmark = 60; // institute benchmark for class average

  // ─── ATTENDANCE ───────────────────────────────────────────
  if (attendancePerSection.length > 0) {
    const belowThreshold = attendancePerSection.filter((s) => s.percentage < threshold);
    const nearThreshold  = attendancePerSection.filter(
      (s) => s.percentage >= threshold && s.percentage < threshold + 5
    );
    const totalSecs = attendancePerSection.length;

    const belowPct = (belowThreshold.length / totalSecs) * 100;
    const nearPct  = (nearThreshold.length  / totalSecs) * 100;

    if (belowPct > 25) {
      alerts.push({
        id: id("tch-att"),
        role: "teacher", level: "critical",
        category: "attendance", scope: "class",
        message: `${Math.round(belowPct)}% of sections have attendance below ${threshold}%`,
        detail: `Sections at risk: ${belowThreshold.map((s) => s.name).join(", ")}`,
        actionable: true,
        meta: { belowCount: belowThreshold.length, totalSecs, belowPct: Math.round(belowPct) },
      });
    } else if (nearPct > 0 || belowPct > 0) {
      const combined = [...belowThreshold, ...nearThreshold];
      alerts.push({
        id: id("tch-att"),
        role: "teacher", level: "warning",
        category: "attendance", scope: "class",
        message: `${combined.length} section(s) near or below the ${threshold}% attendance threshold`,
        detail: combined.map((s) => `${s.name}: ${s.percentage}%`).join(" · "),
        actionable: true,
        meta: { combined: combined.length },
      });
    }

    // Declining trend: compare sections' avg — if summary.avgAttendance exists
    const avgAtt = summary.avgAttendance ?? 0;
    if (avgAtt > 0 && avgAtt < threshold) {
      alerts.push({
        id: id("tch-att-avg"),
        role: "teacher", level: "warning",
        category: "attendance", scope: "class",
        message: `Overall average attendance across your sections is ${avgAtt}% — below policy`,
        detail: "Consider sending reminders or marking patterns.",
        actionable: true,
        meta: { avgAtt, threshold },
      });
    }
  }

  // ─── PERFORMANCE ──────────────────────────────────────────
  if (avgMarksPerAssessment.length > 0) {
    // Use score % from existing data (avg field is already percentage)
    const lowScoreAssessments = avgMarksPerAssessment.filter((a) => a.avg < passing);
    const overallAvg = Math.round(
      avgMarksPerAssessment.reduce((s, a) => s + a.avg, 0) / avgMarksPerAssessment.length
    );

    // >20% assessments with class avg below passing marks = at-risk flag
    const atRiskRatio = lowScoreAssessments.length / avgMarksPerAssessment.length;
    if (atRiskRatio > 0.20) {
      alerts.push({
        id: id("tch-perf"),
        role: "teacher", level: "critical",
        category: "performance", scope: "class",
        message: `${Math.round(atRiskRatio * 100)}% of recent assessments have class average below the ${passing}% passing mark`,
        detail: lowScoreAssessments.map((a) => `${a.title}: ${a.avg}%`).join(" · "),
        actionable: true,
        meta: { atRiskRatio: Math.round(atRiskRatio * 100), passing },
      });
    }

    if (overallAvg < benchmark) {
      alerts.push({
        id: id("tch-bench"),
        role: "teacher", level: "warning",
        category: "performance", scope: "class",
        message: `Class average ${overallAvg}% is below the institute benchmark of ${benchmark}%`,
        detail: "Consider revisiting difficult topics or adjusting assessment difficulty.",
        actionable: true,
        meta: { overallAvg, benchmark },
      });
    }

    // High pass rate — positive
    const highPassAssessments = avgMarksPerAssessment.filter((a) => a.avg >= passing);
    const passRate = (highPassAssessments.length / avgMarksPerAssessment.length) * 100;
    if (passRate >= 85) {
      alerts.push({
        id: id("tch-pass"),
        role: "teacher", level: "positive",
        category: "performance", scope: "class",
        message: `${Math.round(passRate)}% of assessments have class average above the passing mark`,
        detail: "Excellent class performance — well done!",
        actionable: false,
        meta: { passRate: Math.round(passRate) },
      });
    }

    // Variance check: if first and last assessment averages diverge significantly
    if (avgMarksPerAssessment.length >= 3) {
      const first    = avgMarksPerAssessment[0].avg;
      const last     = avgMarksPerAssessment[avgMarksPerAssessment.length - 1].avg;
      const allScores = avgMarksPerAssessment.map((a) => a.avg);
      const mean     = allScores.reduce((s, v) => s + v, 0) / allScores.length;
      const variance = allScores.reduce((s, v) => s + (v - mean) ** 2, 0) / allScores.length;

      if (variance > 200) { // significant spread
        alerts.push({
          id: id("tch-variance"),
          role: "teacher", level: "insight",
          category: "performance", scope: "class",
          message: `Significant grade variance across assessments (spread: ${Math.round(Math.sqrt(variance))}%)`,
          detail: "Some assessments have much higher/lower averages — review difficulty calibration.",
          actionable: true,
          meta: { variance: Math.round(variance) },
        });
      }

      // Trend: declining class performance
      const decline = first - last;
      if (decline >= 10) {
        alerts.push({
          id: id("tch-trend"),
          role: "teacher", level: "warning",
          category: "trend", scope: "class",
          message: `Class average declining: ${first}% → ${last}% across assessments`,
          detail: "Overall class performance is dropping — consider intervention.",
          actionable: true,
          meta: { first, last, decline: Math.round(decline) },
        });
      } else if (last - first >= 8) {
        alerts.push({
          id: id("tch-trend"),
          role: "teacher", level: "positive",
          category: "trend", scope: "class",
          message: `Class performance improving: ${first}% → ${last}%`,
          detail: null,
          actionable: false,
          meta: { first, last },
        });
      }
    }
  }

  // ─── CAPACITY ─────────────────────────────────────────────
  const overflowSections = sectionCapacityUsage.filter((s) => s.percentage >= 95);
  if (overflowSections.length > 0) {
    alerts.push({
      id: id("tch-cap"),
      role: "teacher", level: "insight",
      category: "compliance", scope: "class",
      message: `${overflowSections.length} section(s) at or near full capacity (≥95%)`,
      detail: overflowSections.map((s) => `${s.name}: ${s.enrolled}/${s.capacity}`).join(" · "),
      actionable: true,
      meta: { count: overflowSections.length },
    });
  }

  return finalise(alerts);
}

// ─────────────────────────────────────────────────────────────
//  HOD ALERTS
//  data shape = getHodAnalytics response (data field):
//  { summary, enrollmentPerCourse, avgMarksByCourse,
//    attendanceByCourse, assessmentTypes }
//  + policy
// ─────────────────────────────────────────────────────────────
export function generateHodAlerts(data, policy = {}) {
  const alerts = [];
  if (!data) return alerts;

  const {
    summary              = {},
    avgMarksByCourse     = [],
    attendanceByCourse   = [],
  } = data;

  const threshold = policy.attendanceThreshold ?? 75;
  const passing   = policy.passingMarks        ?? 40;

  // ─── ATTENDANCE ───────────────────────────────────────────
  if (attendanceByCourse.length > 0) {
    const totalPct = attendanceByCourse.reduce((s, c) => s + c.percentage, 0);
    const deptAvgAtt = Math.round(totalPct / attendanceByCourse.length);

    if (deptAvgAtt < threshold) {
      alerts.push({
        id: id("hod-att"),
        role: "hod", level: "critical",
        category: "attendance", scope: "department",
        message: `Department-wide average attendance ${deptAvgAtt}% is below the ${threshold}% policy standard`,
        detail: "Immediate intervention required across multiple courses.",
        actionable: true,
        meta: { deptAvgAtt, threshold },
      });
    }

    const belowCourses = attendanceByCourse.filter((c) => c.percentage < threshold);
    if (belowCourses.length > 0) {
      alerts.push({
        id: id("hod-att-course"),
        role: "hod", level: belowCourses.length > 1 ? "critical" : "warning",
        category: "attendance", scope: "department",
        message: `${belowCourses.length} course(s) have attendance below the ${threshold}% compliance threshold`,
        detail: belowCourses.map((c) => `${c.name}: ${c.percentage}%`).join(" · "),
        actionable: true,
        meta: { count: belowCourses.length, courses: belowCourses.map((c) => c.name) },
      });
    }
  }

  // ─── PERFORMANCE ──────────────────────────────────────────
  if (avgMarksByCourse.length > 0) {
    // avgScore here is raw marks average — convert to percentage context
    // The avgMarksByCourse.avgScore is the raw mean marks, not percentage,
    // but we compare it against passing threshold as-is (it's out of variable totalMarks).
    // We treat it as a relative score — flag courses clearly below the passing benchmark.
    const deptAvgScore = Math.round(
      avgMarksByCourse.reduce((s, c) => s + c.avgScore, 0) / avgMarksByCourse.length
    );

    const failRiskCourses = avgMarksByCourse.filter((c) => c.avgScore < passing);
    if (failRiskCourses.length > 0) {
      const semGroups = {}; // group by course name as proxy (semester not in this shape)
      alerts.push({
        id: id("hod-fail"),
        role: "hod", level: "critical",
        category: "performance", scope: "department",
        message: `${failRiskCourses.length} course(s) have class average below the ${passing}% passing mark — high fail risk`,
        detail: failRiskCourses.map((c) => `${c.name}: ${Math.round(c.avgScore)}%`).join(" · "),
        actionable: true,
        meta: { count: failRiskCourses.length, passing },
      });
    }

    // Find worst-performing course for semester insight
    const sorted     = [...avgMarksByCourse].sort((a, b) => a.avgScore - b.avgScore);
    const worstCourse = sorted[0];
    const bestCourse  = sorted[sorted.length - 1];

    if (worstCourse && bestCourse && avgMarksByCourse.length >= 2) {
      const gap = Math.round(bestCourse.avgScore - worstCourse.avgScore);
      if (gap >= 20) {
        alerts.push({
          id: id("hod-imbalance"),
          role: "hod", level: "insight",
          category: "performance", scope: "department",
          message: `Large performance gap (${gap}%) between best and weakest courses`,
          detail: `Best: ${bestCourse.name} (${Math.round(bestCourse.avgScore)}%) · Weakest: ${worstCourse.name} (${Math.round(worstCourse.avgScore)}%)`,
          actionable: true,
          meta: { gap, best: bestCourse.name, worst: worstCourse.name },
        });
      }
    }
  }

  // ─── RISK MONITORING ──────────────────────────────────────
  const { totalStudents = 0, totalCourses = 0 } = summary;
  if (totalStudents > 0 && avgMarksByCourse.length > 0) {
    // Estimate at-risk students: courses below passing * enrolled
    // We approximate: each failing-avg course has ~50% students at risk
    const failCourses    = avgMarksByCourse.filter((c) => c.avgScore < passing);
    const atRiskEstimate = Math.round(failCourses.length * totalStudents / Math.max(totalCourses, 1) * 0.5);

    if (atRiskEstimate > 0) {
      alerts.push({
        id: id("hod-risk"),
        role: "hod", level: atRiskEstimate > totalStudents * 0.2 ? "critical" : "warning",
        category: "compliance", scope: "department",
        message: `Estimated ${atRiskEstimate} students at risk of failing across the department`,
        detail: "Based on courses with class average below passing threshold.",
        actionable: true,
        meta: { atRiskEstimate, totalStudents },
      });
    }
  }

  return finalise(alerts);
}

// ─────────────────────────────────────────────────────────────
//  DIRECTOR ALERTS
//  data shape = getDirectorAnalytics response (data field):
//  { summary, enrollmentByDept, avgAttendance, deptAvgMarks,
//    monthlyEnrollments }
//  + policy
//  Director NEVER receives individual student data.
// ─────────────────────────────────────────────────────────────
export function generateDirectorAlerts(data, policy = {}) {
  const alerts = [];
  if (!data) return alerts;

  const {
    summary              = {},
    avgAttendance        = 0,
    deptAvgMarks         = [],
    monthlyEnrollments   = [],
  } = data;

  const threshold      = policy.attendanceThreshold ?? 75;
  const passing        = policy.passingMarks        ?? 40;
  const accreditation  = 70; // typical accreditation pass rate benchmark

  // ─── COMPLIANCE — ATTENDANCE ──────────────────────────────
  if (avgAttendance > 0) {
    if (avgAttendance < threshold) {
      alerts.push({
        id: id("dir-att"),
        role: "director", level: "critical",
        category: "compliance", scope: "institute",
        message: `Institute-wide average attendance ${avgAttendance}% is below the minimum academic policy of ${threshold}%`,
        detail: "This is a compliance risk — NAAC/accreditation bodies require minimum attendance standards.",
        actionable: true,
        meta: { avgAttendance, threshold },
      });
    } else if (avgAttendance < threshold + 5) {
      alerts.push({
        id: id("dir-att"),
        role: "director", level: "warning",
        category: "compliance", scope: "institute",
        message: `Institute attendance at ${avgAttendance}% — only ${Math.round(avgAttendance - threshold)}% above the ${threshold}% minimum`,
        detail: "Monitor trends to prevent policy breach.",
        actionable: true,
        meta: { avgAttendance, threshold },
      });
    }
  }

  // ─── COMPLIANCE — PASS RATE ───────────────────────────────
  if (deptAvgMarks.length > 0) {
    const institutionAvgScore = Math.round(
      deptAvgMarks.reduce((s, d) => s + d.avgMarks, 0) / deptAvgMarks.length
    );

    if (institutionAvgScore < passing) {
      alerts.push({
        id: id("dir-pass"),
        role: "director", level: "critical",
        category: "compliance", scope: "institute",
        message: `Institution-wide average score ${institutionAvgScore}% is below the ${passing}% passing mark`,
        detail: "Pass rate may fall below accreditation requirements. Strategic intervention needed.",
        actionable: true,
        meta: { institutionAvgScore, passing, accreditation },
      });
    }

    // ─── STRATEGIC — DEPT DISPARITY ───────────────────────
    if (deptAvgMarks.length >= 2) {
      const sorted   = [...deptAvgMarks].sort((a, b) => a.avgMarks - b.avgMarks);
      const worst    = sorted[0];
      const best     = sorted[sorted.length - 1];
      const disparity = Math.round(best.avgMarks - worst.avgMarks);

      if (disparity >= 20) {
        alerts.push({
          id: id("dir-disparity"),
          role: "director", level: "warning",
          category: "strategic", scope: "institute",
          message: `${disparity}% performance disparity between departments`,
          detail: `${best.name}: ${best.avgMarks}% · ${worst.name}: ${worst.avgMarks}%. Investigate resource or faculty allocation.`,
          actionable: true,
          meta: { disparity, best: best.name, worst: worst.name },
        });
      }

      // Dept below accreditation benchmark
      const belowAccredDepts = deptAvgMarks.filter((d) => d.avgMarks < accreditation);
      if (belowAccredDepts.length > 0) {
        alerts.push({
          id: id("dir-accred"),
          role: "director", level: belowAccredDepts.length > 1 ? "critical" : "warning",
          category: "compliance", scope: "institute",
          message: `${belowAccredDepts.length} department(s) below ${accreditation}% accreditation benchmark`,
          detail: belowAccredDepts.map((d) => `${d.name}: ${d.avgMarks}%`).join(" · "),
          actionable: true,
          meta: { count: belowAccredDepts.length, accreditation },
        });
      }

      // Positive: institute performing well
      if (institutionAvgScore >= accreditation + 10) {
        alerts.push({
          id: id("dir-positive"),
          role: "director", level: "positive",
          category: "strategic", scope: "institute",
          message: `Institute average ${institutionAvgScore}% — exceeding accreditation benchmarks across departments`,
          detail: null,
          actionable: false,
          meta: { institutionAvgScore },
        });
      }
    }
  }

  // ─── STRATEGIC — ENROLLMENT TREND ────────────────────────
  if (monthlyEnrollments.length >= 3) {
    const recent = monthlyEnrollments.slice(-3).map((m) => m.count);
    const older  = monthlyEnrollments.slice(0, -3).map((m) => m.count);

    if (older.length > 0) {
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const olderAvg  = older.reduce((s, v)  => s + v, 0) / older.length;
      const drop      = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);

      if (drop >= 20) {
        alerts.push({
          id: id("dir-enroll"),
          role: "director", level: "insight",
          category: "strategic", scope: "institute",
          message: `Enrollment down ${drop}% in the last three months compared to earlier period`,
          detail: "Investigate admission pipeline, course offerings, or external factors.",
          actionable: true,
          meta: { drop, recentAvg: Math.round(recentAvg), olderAvg: Math.round(olderAvg) },
        });
      }
    }
  }

  return finalise(alerts);
}