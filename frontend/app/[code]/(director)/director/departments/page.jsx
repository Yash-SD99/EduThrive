"use client";

import { useEffect, useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { Trash, SquarePen } from "lucide-react";

export default function Departments() {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm();

	const formRef = useRef(null)
	const [departments, setDepartments] = useState([]);
	const [editingDept, setEditingDept] = useState(null);
	const [teachers, setTeachers] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		if (editingDept && teachers.length > 0) {
			setValue("hod", editingDept.hod?._id || "");
		}
	}, [teachers, editingDept, setValue]);

	// Fetch Departments

	const fetchDepartments = async (currentPage = 1) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments?page=${currentPage}&limit=${pageSize}`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setDepartments(data.data);
			setTotalPages(data.pagination.totalPages);
		}
	};

	useEffect(() => {
		fetchDepartments(page);
	}, [page]);

	//Edit Department
	const handleEdit = async (dept) => {
		setEditingDept(dept);

		setValue("name", dept.name);
		setValue("code", dept.code);

		// fetch teachers first
		await fetchTeachersByDepartment(dept._id);

		// then set hod
		setValue("hod", dept.hod?._id || "");

		formRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	//Fetch Teachers for HOD
	const fetchTeachersByDepartment = async (deptId) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments/${deptId}`,
			{
				credentials: "include",
			}
		);

		const data = await res.json();

		if (data.success) {
			setTeachers(data.data);
		}
	};

	// Add Department
	const onSubmit = async (formData) => {
		try {
			const url = editingDept
				? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments/${editingDept._id}`
				: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments`;

			const method = editingDept ? "PUT" : "POST";

			const res = await fetch(
				url,
				{
					method,
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify(formData),
				}
			);

			const data = await res.json();

			if (!data.success) {
				setError("root", {
					type: "server",
					message: data.message,
				});
				return;
			}

			if (data.success) {
				reset();
				setEditingDept(null);
				fetchDepartments(page);
			}
		}
		catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	//Delete Department
	const handleDelete = async (dept) => {
		try {
			if (!confirm("Are you sure you want to delete this department?")) return;

			const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments/${dept._id}`,
				{
					method: "DELETE",
					credentials: "include",
				}
			)

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

			fetchDepartments(page);
		}
		catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	}

	return (
		<div className="bg-background w-full text-main min-h-screen p-2 space-y-6">
			{/* Form*/}

			<div className="bg-card w-full rounded-lg shadow p-6" ref={formRef}>

				<h2 className="text-lg font-semibold mb-4 text-center">
					{editingDept ? "Edit Department" : "Add Department"}
				</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" >
					<Input
						name="name"
						type="text"
						label="Department Name"
						placeholder="Enter department"
						register={register}
						{...register("name", {
							required: "Department name is required",
						})}
						error={errors.name?.message}
					/>

					<Input
						name="code"
						type="text"
						label="Code"
						placeholder="Enter department code"
						register={register}
						{...register("code", {
							required: "Department code is required",
						})}
						error={errors.code?.message}
					/>

					{editingDept &&
						<div className="space-y-1">
							<label className="text-sm font-semibold">Assign HOD</label>
							<select
								{...register("hod")}
								className=" w-full px-3 py-2 rounded-md border bg-card text-main border-[rgb(var(--text)/0.2)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]">
								<option value="">No HOD</option>

								{teachers.map((teacher) => (
									<option key={teacher._id} value={teacher._id}>
										{teacher.firstName} {teacher.lastName}
									</option>
								))}

							</select>
							{errors.role && (
								<p className="text-sm text-red-500">Role is required</p>
							)}
						</div>
					}

					<Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
						{isSubmitting
							? editingDept ? "Updating..." : "Adding..."
							: editingDept ? "Update Department" : "Add Department"}
					</Button>

					{editingDept && (
						<Button
							variant="danger"
							size="lg"
							className="w-full"
							onClick={() => {
								reset()
								setEditingDept(null)
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

			{/* Table Card */}

			<div className="bg-card w-full rounded-lg shadow overflow-x-scroll">

				<table className="w-full">
					<thead className="bg-primary text-white">
						<tr>
							<th className="text-center p-3">Department</th>
							<th className="text-center p-3">Code</th>
							<th className="text-center p-3">HOD</th>
							<th className="text-center p-3">Action</th>
						</tr>
					</thead>

					<tbody>

						{departments.length === 0 ? (
							<tr>
								<td
									colSpan="3"
									className="p-4 text-main text-center"
								>
									No departments found
								</td>
							</tr>
						) : (
							departments.map((dept) => (
								<tr
									key={dept._id}
									className="border-b border-gray-200 hover:bg-[rgb(var(--secondary))]"
								>
									<td className="p-3 text-center">
										{dept.name}
									</td>

									<td className="p-3 text-center">
										{dept.code}
									</td>

									<td className="p-3 text-center">
										{dept.hod
											? `${dept.hod.firstName} ${dept.hod.lastName}`
											: "-"}
									</td>

									<td className="flex gap-[25px] items-center p-3 justify-center">
										<Button className="!bg-green-500" size="sm" onClick={() => handleEdit(dept)}>
											<SquarePen size={16} />
										</Button>

										<Button variant="danger" size="sm" onClick={() => handleDelete(dept)}>
											<Trash size={16} />
										</Button>
									</td>
								</tr>
							))
						)}

					</tbody>

				</table>

			</div>


			{/* ===================== */}
			{/* Pagination */}
			{/* ===================== */}

			{
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

			}

		</div>
	);
}