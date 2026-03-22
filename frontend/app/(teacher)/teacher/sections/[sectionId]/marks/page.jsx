"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const Marks = () => {
	const { sectionId } = useParams()
	const router = useRouter()

	const [assessments, setAssessments] = useState([])
	const [loading, setLoading] = useState(true)

	// Pagination
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const limit = 10

	// =============================
	// FETCH
	// =============================
	const fetchAssessments = async (currentPage = 1) => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments?page=${currentPage}&limit=${limit}`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setAssessments(data.data)
			setTotalPages(data.pagination?.totalPages || 1)

		} catch (err) {
			toast.error(err.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (sectionId) {
			fetchAssessments(page)
		}
	}, [sectionId, page])

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" })
	}, [page])

	// =============================
	// NAVIGATE
	// =============================
	const handleSelect = (assessmentId) => {
		router.push(`/teacher/sections/${sectionId}/marks/${assessmentId}`)
	}

	// =============================
	// UI
	// =============================
	if (loading) {
		return <div className="text-center p-4">Loading...</div>
	}

	if (assessments.length === 0) {
		return (
			<div className="text-center p-4 text-muted">
				No assessments found
			</div>
		)
	}

	return (
		<div className="p-2 space-y-6">

			<h1 className="text-2xl font-semibold">
				Select Assessment
			</h1>

			{/* CARDS */}
			<div className="flex flex-col gap-4">

				{assessments.map(a => (
					<div
						key={a._id}
						onClick={() => handleSelect(a._id)}
						className="bg-card p-4 rounded-lg shadow border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-[rgb(var(--primary))]"
					>

						<div className="flex justify-between items-center">
							<div>
								<h2 className="font-semibold text-lg">
									{a.title}
								</h2>
								<p className="text-sm text-muted">
									{a.type}
								</p>
							</div>

							<div className="text-sm bg-[rgb(var(--secondary))] px-3 py-1 rounded">
								{a.totalMarks} Marks
							</div>
						</div>

						<div className="border-t my-2"></div>

						<p className="text-sm text-muted">
							{new Date(a.date).toLocaleDateString()}
						</p>

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

export default Marks