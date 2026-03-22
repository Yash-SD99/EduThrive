"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const CourseDetail = () => {
	const { courseId } = useParams()
	const router = useRouter()

	const [activeTab, setActiveTab] = useState("marks")

	const [marks, setMarks] = useState([])
	const [attendance, setAttendance] = useState(null)

	const [loading, setLoading] = useState(true)

	// Optional course info from localStorage
	const [course, setCourse] = useState(null)

	useEffect(() => {
		const stored = localStorage.getItem("selectedCourse")
		if (stored) setCourse(JSON.parse(stored))
	}, [])

	// =============================
	// FETCH MARKS
	// =============================
	const fetchMarks = async () => {
		try {
			setLoading(true)

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/courses/${courseId}/marks`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setMarks(data.data)

		} catch (err) {
			toast.error(err.message || "Failed to load marks")
		} finally {
			setLoading(false)
		}
	}

	// =============================
	// FETCH ATTENDANCE
	// =============================
	const fetchAttendance = async () => {
		try {
			setLoading(true)

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/courses/${courseId}/attendance`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setAttendance(data)

		} catch (err) {
			toast.error(err.message || "Failed to load attendance")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (activeTab === "marks") fetchMarks()
		else fetchAttendance()
	}, [activeTab])

	// =============================
	// LOADING
	// =============================
	if (loading) {
		return (
			<div className="p-6 text-center text-muted text-xl">
				Loading...
			</div>
		)
	}

	return (
		<div className="bg-background min-h-screen p-3 md:p-6 text-main space-y-6">

			{/* ============================= */}
			{/* HEADER */}
			{/* ============================= */}
			<div className="flex items-center justify-between">

				{/* Back */}
				<Button
					variant="secondary"
					onClick={() => router.back()}
				>
					← Back
				</Button>

			</div>

			{/* Course Info */}
			<div className="bg-card p-4 rounded-xl shadow border">
				<h1 className="text-xl md:text-2xl font-semibold">
					{course?.course?.name || "Course"}
				</h1>
				<p className="text-sm text-muted mt-1">
					Code: {course?.course?.code || "—"}
				</p>
			</div>

			{/* ============================= */}
			{/* TABS */}
			{/* ============================= */}
			<div className="flex gap-3">
				<Button
					variant={activeTab === "marks" ? "primary" : "secondary"}
					onClick={() => setActiveTab("marks")}
				>
					Marks
				</Button>

				<Button
					variant={activeTab === "attendance" ? "primary" : "secondary"}
					onClick={() => setActiveTab("attendance")}
				>
					Attendance
				</Button>
			</div>

			{/* ============================= */}
			{/* MARKS */}
			{/* ============================= */}
			{activeTab === "marks" && (
				<div className="bg-card p-4 rounded-xl shadow space-y-3">

					{marks.length === 0 ? (
						<p className="text-center text-muted">
							No assessments found
						</p>
					) : (
						marks.map(item => (
							<div
								key={item.assessmentId}
								className="flex justify-between items-center border p-3 rounded-lg hover:bg-muted/40 transition"
							>
								<div>
									<h2 className="font-semibold">
										{item.title}
									</h2>
									<p className="text-xs text-muted">
										{item.type} • {new Date(item.date).toLocaleDateString()}
									</p>
								</div>

								<div className="text-right font-semibold">
									{item.marksObtained ?? "-"} / {item.maxMarks}
								</div>
							</div>
						))
					)}

				</div>
			)}

			{/* ============================= */}
			{/* ATTENDANCE */}
			{/* ============================= */}
			{activeTab === "attendance" && attendance && (
				<div className="space-y-4">

					{/* SUMMARY */}
					<div className="bg-card p-4 rounded-xl shadow grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

						<div>
							<p className="text-muted text-sm">Total</p>
							<p className="font-semibold text-lg">
								{attendance.summary.totalClasses}
							</p>
						</div>

						<div>
							<p className="text-muted text-sm">Present</p>
							<p className="font-semibold text-green-500 text-lg">
								{attendance.summary.present}
							</p>
						</div>

						<div>
							<p className="text-muted text-sm">Absent</p>
							<p className="font-semibold text-red-500 text-lg">
								{attendance.summary.absent}
							</p>
						</div>

						<div>
							<p className="text-muted text-sm">%</p>
							<p className="font-semibold text-lg">
								{attendance.summary.attendancePercentage}%
							</p>
						</div>

					</div>

					{/* RECORDS */}
					<div className="bg-card p-4 rounded-xl shadow space-y-2">

						{attendance.records.length === 0 ? (
							<p className="text-center text-muted">
								No attendance records
							</p>
						) : (
							attendance.records.map((rec, i) => (
								<div
									key={i}
									className="flex justify-between items-center border-b py-2"
								>
									<span className="text-sm">
										{new Date(rec.date).toLocaleDateString()}
									</span>

									<span
										className={`text-sm font-medium ${
											rec.status === "present"
												? "text-green-500"
												: "text-red-500"
										}`}
									>
										{rec.status}
									</span>
								</div>
							))
						)}

					</div>

				</div>
			)}

		</div>
	)
}

export default CourseDetail