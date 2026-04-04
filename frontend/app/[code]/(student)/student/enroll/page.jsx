"use client"

import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const Enroll = () => {
	const [courses, setCourses] = useState([])
	const [loading, setLoading] = useState(true)

	// Pagination
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const limit = 10

	// =============================
	// FETCH COURSES
	// =============================
	const fetchCourses = async (currentPage = 1) => {
		try {
			setLoading(true)

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/enroll?page=${currentPage}&limit=${limit}`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setCourses(data.data)
			setTotalPages(data.pagination?.totalPages || 1)

		} catch (err) {
			toast.error(err.message || "Failed to load courses")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCourses(page)
	}, [page])

	// =============================
	// HANDLE ENROLL
	// =============================
	const handleEnroll = async (courseId) => {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/enroll/${courseId}`,
			{
				method: "POST",
				credentials: "include"
			}
		)

		const data = await res.json()

		if (!data.success) throw new Error(data.message)

		toast.success(`Enrolled in section ${data.assignedSection}`)

		//RESET TO FIRST PAGE (important)
		setPage(1)

		//REFETCH AFTER SMALL DELAY (ensures DB commit reflected)
		setTimeout(() => {
			fetchCourses(1)
		}, 200)

	} catch (err) {
		toast.error(err.message)
	}
}

	// =============================
	// UI STATES
	// =============================
	if (loading) {
		return (
			<div className="p-4 text-muted text-2xl text-center">
				Loading courses...
			</div>
		)
	}

	if (courses.length === 0) {
		return (
			<div className="p-4 text-muted text-2xl text-center">
				No available courses to enroll
			</div>
		)
	}

	// =============================
	// UI
	// =============================
	return (
		<div className="bg-background w-full text-main min-h-screen p-2 space-y-6">

			{/* Title */}
			<h1 className="text-2xl font-semibold">
				Available Courses
			</h1>

			{/* CARDS */}
			<div className="flex flex-col gap-4">

				{courses.map(course => (
					<div
						key={course._id}
						className="bg-card p-4 rounded-lg shadow border transition-all duration-200 hover:shadow-lg hover:border-[rgb(var(--primary))]"
					>

						{/* TOP */}
						<div className="flex justify-between items-center mb-3">
							<div>
								<h2 className="text-lg font-semibold">
									{course.name}
								</h2>
								<p className="text-sm text-muted">
									Code: {course.code}
								</p>
							</div>

							<Button
								onClick={() => handleEnroll(course._id)}
							>
								Enroll
							</Button>
						</div>

						{/* DIVIDER */}
						<div className="border-t my-3"></div>

						{/* DETAILS */}
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
							<div>
								<p className="text-muted">Department</p>
								<p className="font-semibold">
									{course.department?.name}
								</p>
							</div>

							<div>
								<p className="text-muted">Dept Code</p>
								<p className="font-semibold">
									{course.department?.code}
								</p>
							</div>

							<div>
								<p className="text-muted">Semester</p>
								<p className="font-semibold">
									{course.semester}
								</p>
							</div>

							<div>
								<p className="text-muted">Credits</p>
								<p className="font-semibold">
									{course.credits}
								</p>
							</div>
						</div>

					</div>
				))}

			</div>

			{/* ============================= */}
			{/* PAGINATION */}
			{/* ============================= */}
			<div className="flex justify-center items-center gap-4">

				<Button
					variant="secondary"
					disabled={page === 1}
					onClick={() => setPage(p => p - 1)}
				>
					Prev
				</Button>

				<span>
					Page {page} / {totalPages}
				</span>

				<Button
					variant="secondary"
					disabled={page === totalPages}
					onClick={() => setPage(p => p + 1)}
				>
					Next
				</Button>

			</div>

		</div>
	)
}

export default Enroll
