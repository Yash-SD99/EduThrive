"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const Courses = () => {
	const [courses, setCourses] = useState([])
	const [loading, setLoading] = useState(true)

	// Pagination
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const pageSize = 10

	const router = useRouter()

	// =============================
	// FETCH COURSES
	// =============================
	const fetchCourses = async (currentPage = 1) => {
		try {
			setLoading(true)

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/courses?page=${currentPage}&limit=${pageSize}`,
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
	// HANDLE CLICK (Go inside course)
	// =============================
	const handleOpenCourse = (course) => {
		localStorage.setItem("selectedCourse", JSON.stringify(course))
		router.push(`/student/courses/${course.course.id}`)
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
				No enrolled courses
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
				My Courses
			</h1>

			{/* Cards */}
			<div className="w-full flex flex-col gap-4">
				{courses.map(item => (
					<div
						key={item.enrollmentId}
						onClick={() => handleOpenCourse(item)}
						className="w-full bg-card p-4 rounded-lg shadow border cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-[rgb(var(--primary))]"
					>

						{/* TOP */}
						<div className="flex justify-between items-center mb-3">
							<div className="flex flex-col gap-2">
								<h2 className="text-lg font-semibold mb-2">
									{item.course.name}
								</h2>
								<p className="text-sm text-muted">
									Code: {item.course.code}
								</p>

								<p className="text-sm text-muted">
									Credits: {item.course.credits}
								</p>
							</div>

							<div className="text-sm font-medium text-center bg-[rgb(var(--secondary))] p-2 rounded">
								Section {item.section.name}
							</div>
						</div>

						{/* DIVIDER */}
						<div className="border-t my-3"></div>

						{/* DETAILS */}
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

							<div>
								<p className="text-muted">Department</p>
								<p className="font-semibold">
									{item.course.department.name}
								</p>
							</div>

							<div>
								<p className="text-muted">Teacher</p>
								<p className="font-semibold">
									{item.teacher.firstName} {item.teacher.lastName}
								</p>
							</div>

							<div>
								<p className="text-muted">Academic Year</p>
								<p className="font-semibold">
									{item.section.academicYear}
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

export default Courses
