"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { Trash } from "lucide-react"
import toast from "react-hot-toast"

const Attendance = () => {
	const { sectionId } = useParams()
	const router = useRouter()

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting }
	} = useForm()

	const formRef = useRef(null)

	const [attendanceList, setAttendanceList] = useState([])

	// Pagination
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const limit = 10

	// =============================
	// FETCH ATTENDANCE
	// =============================
	const fetchAttendance = async (currentPage = 1) => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/attendance?page=${currentPage}&limit=${limit}`,
				{ credentials: "include" }
			)

			const data = await res.json()

			if (!data.success) throw new Error(data.message)

			setAttendanceList(data.data)
			setTotalPages(data.pagination?.totalPages || 1)

		} catch (err) {
			toast.error(err.message)
		}
	}

	useEffect(() => {
		if (sectionId) fetchAttendance(page)
	}, [sectionId, page])

	// =============================
	// CREATE ATTENDANCE
	// =============================
	const onSubmit = async (formData) => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/attendance`,
				{
					method: "POST", //  FIXED
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						date: formData.date
					})
				}
			)

			const data = await res.json()

			if (!data.success) {
				setError("root", { message: data.message })
				return
			}

			toast.success("Attendance created")

			reset()
			fetchAttendance(page)

		} catch {
			setError("root", { message: "Network error" })
		}
	}

	// =============================
	// DELETE
	// =============================
	const handleDelete = async (e, item) => {
		e.stopPropagation() // IMPORTANT: prevent card click

		if (!confirm("Delete this attendance?")) return

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/attendance/${item._id}`,
			{
				method: "DELETE",
				credentials: "include"
			}
		)

		const data = await res.json()

		if (!data.success) {
			toast.error(data.message)
			return
		}

		toast.success("Deleted")
		fetchAttendance(page)
	}

	// =============================
	// NAVIGATE TO DETAIL PAGE
	// =============================
	const handleClick = (attendanceId) => {
		router.push(`/teacher/sections/${sectionId}/attendance/${attendanceId}`)
	}

	// =============================
	// UI
	// =============================
	return (
		<div className="bg-background text-main min-h-screen p-2 space-y-6">

			{/* FORM */}
			<div ref={formRef} className="bg-card p-6 rounded-lg shadow">
				<h2 className="text-lg font-semibold text-center mb-4">
					Create Attendance
				</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

					<Input
						type="date"
						label="Date"
						register={register}
						{...register("date", { required: "Date is required" })}
						error={errors.date?.message}
					/>

					<Button type="submit" className="w-full">
						{isSubmitting ? "Saving..." : "Create"}
					</Button>

					{errors.root && (
						<p className="text-red-500 text-center">
							{errors.root.message}
						</p>
					)}

				</form>
			</div>

			{/* CARDS */}
			<div className="flex flex-col gap-4">

				{attendanceList.length === 0 ? (
					<div className="text-center text-muted p-4">
						No attendance records
					</div>
				) : (
					attendanceList.map(a => {
						const presentCount =
							a.records?.filter(r => r.status === "present").length || 0

						const total = a.records?.length || 0

						return (
							<div
								key={a._id}
								onClick={() => handleClick(a._id)}
								className="bg-card p-4 rounded-lg shadow border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
							>

								{/* TOP */}
								<div className="flex justify-between items-center">

									<div>
										<h2 className="font-semibold text-lg">
											{new Date(a.date).toLocaleDateString()}
										</h2>

										<p className="text-sm text-muted">
											Attendance Record
										</p>
									</div>

									{/* DELETE BUTTON */}
									<div className="flex justify-center">
										<Button
											variant="danger"
											size="lg"
											onClick={(e) => handleDelete(e, a)}
										>
											<Trash size={16} />
										</Button>
									</div>

								</div>

								{/* DIVIDER */}
								<div className="border-t my-2"></div>

								<div className="text-sm bg-[rgb(var(--secondary))] text-center p-4 rounded">
									{presentCount}/{total} Present
								</div>


							</div>
						)
					})
				)}

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

export default Attendance