"use client"

import { useEffect, useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { Trash, SquarePen } from "lucide-react";

const Courses = () => {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm();

	const formRef = useRef(null)
	const [courses, setCourses] = useState([]);
	const [editingCourse, setEditingCourse] = useState(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const pageSize = 10;

	// ================================
	// Fetch Courses
	// ================================
	const fetchCourses = async (currentPage = 1) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/courses?page=${currentPage}&limit=${pageSize}`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setCourses(data.data);
			setTotalPages(data.pagination?.totalPages || 1);
		}
	};

	useEffect(() => {
		fetchCourses(page);
	}, [page]);

	// ================================
	// Edit Course
	// ================================
	const handleEdit = (course) => {
		setEditingCourse(course);

		setValue("name", course.name);
		setValue("sem", course.semester);
		setValue("credits", course.credits);

		formRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// ================================
	// Add / Update Course
	// ================================
	const onSubmit = async (formData) => {
		try {
			const url = editingCourse
				? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/courses/${editingCourse._id}`
				: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/courses`;

			const method = editingCourse ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(formData),
			});

			const data = await res.json();

			if (!data.success) {
				setError("root", {
					type: "server",
					message: data.message,
				});
				return;
			}

			reset();
			setEditingCourse(null);
			fetchCourses(page);

		} catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	// ================================
	// Delete Course
	// ================================
	const handleDelete = async (course) => {
		try {
			if (!confirm("Are you sure you want to delete this course?")) return;

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/courses/${course._id}`,
				{
					method: "DELETE",
					credentials: "include",
				}
			);

			const data = await res.json();

			if (!data.success) {
				setError("root", {
					type: "server",
					message: data.message,
				});

				formRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});

				return;
			}

			fetchCourses(page);

		} catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	return (
		<div className="bg-background w-full text-main min-h-screen p-2 space-y-6">

			{/* Form */}
			<div className="bg-card w-full rounded-lg shadow p-6" ref={formRef}>
				<h2 className="text-lg font-semibold mb-4 text-center">
					{editingCourse ? "Edit Course" : "Add Course"}
				</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

					<Input
						label="Course Name"
						placeholder="Enter Course Name"
						register={register}
						{...register("name", {
							required: "Course name is required",
						})}
						error={errors.name?.message}
					/>

					<Input
						type="number"
						label="Semester"
						placeholder="Enter Semester (1-8)"
						register={register}
						{...register("sem", {
							required: "Semester is required",
							min: { value: 1, message: "Min 1" },
							max: { value: 8, message: "Max 8" }
						})}
						error={errors.sem?.message}
					/>

					<Input
						type="number"
						label="Credits"
						placeholder="Enter Credits (0-4)"
						register={register}
						{...register("credits", {
							required: "Credits are required",
							min: { value: 0, message: "Min 0" },
							max: { value: 4, message: "Max 4" }
						})}
						error={errors.credits?.message}
					/>

					<Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
						{isSubmitting
							? editingCourse ? "Updating..." : "Adding..."
							: editingCourse ? "Update Course" : "Add Course"}
					</Button>

					{editingCourse && (
						<Button
							variant="danger"
							size="lg"
							className="w-full"
							onClick={() => {
								reset()
								setEditingCourse(null)
							}}
						>
							Cancel Edit
						</Button>
					)}

					{errors.root && (
						<p className="text-xl font-bold text-center text-red-500">
							{errors.root.message}
						</p>
					)}
				</form>
			</div>

			{/* Table */}
			<div className="bg-card w-full rounded-lg shadow overflow-x-scroll">
				<table className="w-full">
					<thead className="bg-primary text-white">
						<tr>
							<th className="text-center p-3">Name</th>
							<th className="text-center p-3">Code</th>
							<th className="text-center p-3">Semester</th>
							<th className="text-center p-3">Credits</th>
							<th className="text-center p-3">Action</th>
						</tr>
					</thead>

					<tbody>
						{courses.length === 0 ? (
							<tr>
								<td colSpan="5" className="p-4 text-main text-center">
									No courses found
								</td>
							</tr>
						) : (
							courses.map((course) => (
								<tr
									key={course._id}
									className="border-b border-gray-200 hover:bg-[rgb(var(--secondary))]"
								>
									<td className="p-3 text-center">{course.name}</td>
									<td className="p-3 text-center">{course.code}</td>
									<td className="p-3 text-center">{course.semester}</td>
									<td className="p-3 text-center">{course.credits}</td>

									<td className="flex gap-[25px] items-center p-3 justify-center">
										<Button className="!bg-green-500" size="sm" onClick={() => handleEdit(course)}>
											<SquarePen size={16} />
										</Button>

										<Button variant="danger" size="sm" onClick={() => handleDelete(course)}>
											<Trash size={16} />
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex justify-center items-center gap-4">
				<Button
					variant="secondary"
					disabled={page === 1}
					onClick={() => setPage((p) => p - 1)}
				>
					Prev
				</Button>

				<span className="text-main">
					Page {page} / {totalPages}
				</span>

				<Button
					variant="secondary"
					disabled={page === totalPages}
					onClick={() => setPage((p) => p + 1)}
				>
					Next
				</Button>
			</div>

		</div>
	)
}

export default Courses