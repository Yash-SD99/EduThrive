"use client"

import { useEffect, useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { Trash, SquarePen } from "lucide-react";

const Teachers = () => {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm();

	const formRef = useRef(null)
	const [teachers, setTeachers] = useState([]);
	const [editingTeach, setEditingTeach] = useState(null);
	const [departments, setDepartments] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		fetchDepartments()
	}, [])

	//Fetch Departments
	const fetchDepartments = async () => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/departments`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setDepartments(data.data)
		}
	}

	//Fetch Teachers
	const fetchTeachers = async (currentPage = 1) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/teachers?page=${currentPage}&limit=${pageSize}`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setTeachers(data.data);
			setTotalPages(data.pagination.totalPages);
		}
	};

	useEffect(() => {
		fetchTeachers(page);
	}, [page]);

	//Edit Teacher
	const handleEdit = async (teach) => {
		setEditingTeach(teach);

		setValue("firstName", teach.firstName);
		setValue("lastName", teach.lastName);
		setValue("phone", teach.phone);
		setValue("department", teach.department._id);

		formRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// Add Teacher
	const onSubmit = async (formData) => {
		try {
			const url = editingTeach
				? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/teachers/${editingTeach._id}`
				: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/teachers`;

			const method = editingTeach ? "PUT" : "POST";

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
				setEditingTeach(null);
				fetchTeachers(page);
			}
		}
		catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	//Delete Teacher
	const handleDelete = async (teach) => {
		try {
			if (!confirm("Are you sure you want to delete this teacher?")) return;

			const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/teachers/${teach._id}`,
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

			fetchTeachers(page);
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
					{editingTeach ? "Edit Teacher" : "Add Teacher"}
				</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" >
					<Input
						name="firstName"
						type="text"
						label="First Name"
						placeholder="Enter First Name"
						register={register}
						{...register("firstName", {
							required: "Teacher's first name is required",
						})}
						error={errors.firstName?.message}
					/>

					<Input
						name="lastName"
						type="text"
						label="Last Name"
						placeholder="Enter last Name"
						register={register}
						{...register("lastName", {
							required: "Teacher's last name is required",
						})}
						error={errors.lastName?.message}
					/>

					<Input
						name="phone"
						type="tel"
						minLength={10}
						maxLength={10}
						label="Phone"
						placeholder="Enter Phone Number"
						register={register}
						{...register("phone", {
							required: "Teacher's phone Number is required",
							minLength: {
								value: 10,
								message: "Phone must be 10 digits",
							},
							maxLength: {
								value: 10,
								message: "Phone must be 10 digits",
							},
							pattern: {
								value: /^[0-9]{10}$/,
								message: "Phone must be a valid 10-digit number",
							},
						})}
						error={errors.phone?.message}
					/>

					<div className="space-y-1">
						<label className="text-sm font-semibold">Department</label>
						<select
							{...register("department", {
								required: "Please select a department",
								validate: (value) =>
									value !== "" || "Please select a valid department",
							})}
							defaultValue=""
							className=" w-full px-3 py-2 rounded-md border bg-card text-main border-[rgb(var(--text)/0.2)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]">
							<option value="" disabled>Select Department</option>

							{departments.map((dept) => (
								<option key={dept._id} value={dept._id}>
									{dept.name}
								</option>
							))}

						</select>
						{errors.department && (
							<p className="text-sm text-red-500">
								{errors.department.message}
							</p>
						)}
					</div>

					<Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
						{isSubmitting
							? editingTeach ? "Updating..." : "Adding..."
							: editingTeach ? "Update Teacher" : "Add Teacher"}
					</Button>

					{editingTeach && (
						<Button
							variant="danger"
							size="lg"
							className="w-full"
							onClick={() => {
								reset()
								setEditingTeach(null)
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
							<th className="text-center p-3">Name</th>
							<th className="text-center p-3">Department</th>
							<th className="text-center p-3">Role</th>
							<th className="text-center p-3">Email</th>
							<th className="text-center p-3">Phone</th>
							<th className="text-center p-3">Action</th>
						</tr>
					</thead>

					<tbody>

						{teachers.length === 0 ? (
							<tr>
								<td
									colSpan="6"
									className="p-4 text-main text-center"
								>
									No teachers found
								</td>
							</tr>
						) : (
							teachers.map((teach) => (
								<tr
									key={teach._id}
									className="border-b border-gray-200 hover:bg-[rgb(var(--secondary))]"
								>
									<td className="p-3 text-center">
										{teach.firstName} {teach.lastName}
									</td>

									<td className="p-3 text-center">
										{teach.department.name}
									</td>

									<td className="p-3 text-center">
										{teach.role}
									</td>

									<td className="p-3 text-center">
										{teach.email}
									</td>

									<td className="p-3 text-center">
										{teach.phone}
									</td>

									<td className="flex gap-[25px] items-center p-3 justify-center">
										<Button className="!bg-green-500" size="sm" onClick={() => handleEdit(teach)}>
											<SquarePen size={16} />
										</Button>

										<Button variant="danger" size="sm" onClick={() => handleDelete(teach)}>
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
	)
}

export default Teachers