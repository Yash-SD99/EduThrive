"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const Students = () => {
	const { sectionId } = useParams()

	const [students, setStudents] = useState([])
	const [loading, setLoading] = useState(true)

	// Pagination
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const limit = 10

	// =============================
	// FETCH STUDENTS
	// =============================
	const fetchStudents = async (currentPage = 1) => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/students?page=${currentPage}&limit=${limit}`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setStudents(data.data)
			setTotalPages(data.pagination?.totalPages || 1)

		} catch (err) {
			toast.error(err.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (sectionId) {
			fetchStudents(page)
		}
	}, [sectionId, page])

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" })
	}, [page])

	// =============================
	// UI STATES
	// =============================
	if (loading) {
		return <div className="text-center p-4">Loading...</div>
	}

	if (students.length === 0) {
		return (
			<div className="text-center p-4 text-muted">
				No students found
			</div>
		)
	}

	return (
		<div className="p-2 space-y-6">

			<h1 className="text-2xl font-semibold">
				Section Students
			</h1>

			{/* CARDS */}
			<div className="flex flex-col gap-4">

				{students.map(s => (
					<div
						key={s._id}
						className="bg-card p-4 rounded-lg shadow border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-[rgb(var(--primary))]"
					>

						<div className="flex justify-between items-center">
							<div>
								<h2 className="font-semibold text-lg">
									{s.firstName} {s.lastName}
								</h2>
								<p className="text-sm text-muted">
									Roll No: {s.rollNo}
								</p>
							</div>

							<div className="text-sm bg-[rgb(var(--secondary))] px-3 py-1 rounded">
								Student
							</div>
						</div>

					</div>
				))}

			</div>

			{/* PAGINATION */}
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

export default Students