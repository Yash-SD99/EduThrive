"use client"

import { useEffect, useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { Trash, SquarePen } from "lucide-react";

const Students = () => {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm();

	const formRef = useRef(null)
	const [students, setStudents] = useState([]);
	const [editingStud, setEditingStud] = useState(null);
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

	//Fetch Students
	const fetchStudents = async (currentPage = 1) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/students?page=${currentPage}&limit=${pageSize}`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setStudents(data.data);
			setTotalPages(data.pagination.totalPages);
		}
	};

	useEffect(() => {
		fetchStudents(page);
	}, [page]);

	//Edit Student
	const handleEdit = async (stud) => {
		setEditingStud(stud);

		setValue("firstName", stud.firstName);
		setValue("lastName", stud.lastName);
		setValue("phone", stud.phone);
		setValue("department", stud.department._id);

		formRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// Add Student
	const onSubmit = async (formData) => {
		try {
			const url = editingStud
				? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/students/${editingStud._id}`
				: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/students`;

			const method = editingStud ? "PUT" : "POST";

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
				setEditingStud(null);
				fetchStudents(page);
			}
		}
		catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	//Delete Student
	const handleDelete = async (Stud) => {
		try {
			if (!confirm("Are you sure you want to delete this student?")) return;

			const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/students/${Stud._id}`,
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

			fetchStudents(page);
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
					{editingStud ? "Edit Student" : "Add Student"}
				</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" >
					<Input
						name="firstName"
						type="text"
						label="First Name"
						placeholder="Enter First Name"
						register={register}
						{...register("firstName", {
							required: "Student's first name is required",
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
							required: "Student's last name is required",
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
							required: "Student's phone Number is required",
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
							? editingStud ? "Updating..." : "Adding..."
							: editingStud ? "Update Student" : "Add Student"}
					</Button>

					{editingStud && (
						<Button
							variant="danger"
							size="lg"
							className="w-full"
							onClick={() => {
								reset()
								setEditingStud(null)
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
							<th className="text-center p-3">Roll No</th>
							<th className="text-center p-3">Email</th>
							<th className="text-center p-3">Phone</th>
							<th className="text-center p-3">Action</th>
						</tr>
					</thead>

					<tbody>

						{students.length === 0 ? (
							<tr>
								<td
									colSpan="6"
									className="p-4 text-main text-center"
								>
									No students found
								</td>
							</tr>
						) : (
							students.map((Stud) => (
								<tr
									key={Stud._id}
									className="border-b border-gray-200 hover:bg-[rgb(var(--secondary))]"
								>
									<td className="p-3 text-center">
										{Stud.firstName} {Stud.lastName}
									</td>

									<td className="p-3 text-center">
										{Stud.department.name}
									</td>

									<td className="p-3 text-center">
										{Stud.rollNo}
									</td>

									<td className="p-3 text-center">
										{Stud.email}
									</td>

									<td className="p-3 text-center">
										{Stud.phone}
									</td>

									<td className="flex gap-[25px] items-center p-3 justify-center">
										<Button className="!bg-green-500" size="sm" onClick={() => handleEdit(Stud)}>
											<SquarePen size={16} />
										</Button>

										<Button variant="danger" size="sm" onClick={() => handleDelete(Stud)}>
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

export default Students