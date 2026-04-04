"use client"

import { useEffect, useState, useRef } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { Trash, SquarePen } from "lucide-react";

const Sections = () => {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm();

	const formRef = useRef(null)

	const [sections, setSections] = useState([]);
	const [courses, setCourses] = useState([]);
	const [teachers, setTeachers] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState("");

	const [editingSection, setEditingSection] = useState(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const pageSize = 10;

	// ================================
	// Fetch Courses
	// ================================
	const fetchCourses = async () => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/courses`,
			{ credentials: "include" }
		);

		const data = await res.json();
		if (data.success) setCourses(data.data);
	};

	// ================================
	// Fetch Teachers
	// ================================
	const fetchTeachers = async () => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/teachers`,
			{ credentials: "include" }
		);

		const data = await res.json();
		if (data.success) setTeachers(data.data);
	};

	// ================================
	// Fetch Sections
	// ================================
	const fetchSections = async (currentPage = 1) => {
		if (!selectedCourse) return;

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/sections?courseId=${selectedCourse}&page=${currentPage}&limit=${pageSize}`,
			{ credentials: "include" }
		);

		const data = await res.json();

		if (data.success) {
			setSections(data.data);
			setTotalPages(data.pagination?.totalPages || 1);
		}
	};

	useEffect(() => {
		fetchCourses();
		fetchTeachers();
	}, []);

	useEffect(() => {
		setPage(1);
		fetchSections(1);
	}, [selectedCourse]);

	useEffect(() => {
		fetchSections(page);
	}, [page]);

	// ================================
	// Edit Section
	// ================================
	const handleEdit = (section) => {
		setEditingSection(section);

		setValue("sectionName", section.sectionName)
		setValue("teacherId", section.teacher._id);
		setValue("capacity", section.capacity);
		setValue("academicYear", section.academicYear)

		formRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// ================================
	// Create / Update Section
	// ================================
	const onSubmit = async (formData) => {
		try {
			const payload = {
				...formData,
				courseId: selectedCourse
			};

			const url = editingSection
				? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/sections/${editingSection._id}`
				: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/sections`;

			const method = editingSection ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
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
			setEditingSection(null);
			fetchSections(page);

		} catch {
			setError("root", {
				message: "Network error",
			});
		}
	};

	// ================================
	// Delete Section
	// ================================
	const handleDelete = async (section) => {
		if (!confirm("Delete this section?")) return;

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hod/sections/${section._id}`,
			{
				method: "DELETE",
				credentials: "include"
			}
		);

		const data = await res.json();

		if (!data.success) {
			setError("root", { message: data.message });
			return;
		}

		fetchSections(page);
	};

	return (
		<div className="bg-background w-full text-main min-h-screen p-2 space-y-6">

			{/* Course Selector */}
			<div className="bg-card p-4 rounded-lg shadow">
				<h2 className="text-lg font-semibold mb-4 text-center">
						Select Course
					</h2>
				<select
					value={selectedCourse}
					onChange={(e) => setSelectedCourse(e.target.value)}
					className="w-full px-3 py-2 rounded-md border bg-card text-main border-[rgb(var(--text)/0.2)]"
				>
					<option value="">Select Course</option>
					{courses.map(c => (
						<option key={c._id} value={c._id}>
							{c.name} ({c.code})
						</option>
					))}
				</select>
			</div>

			{/* Form */}
			{selectedCourse && (
				<div className="bg-card w-full rounded-lg shadow p-6" ref={formRef}>

					<h2 className="text-lg font-semibold mb-4 text-center">
						{editingSection ? "Edit Section" : "Add Section"}
					</h2>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

						{/* Section Name */}
						<select {...register("sectionName", { required: true })}
							className="w-full px-3 py-2 rounded-md border bg-card text-main">
							<option value="">Select Section</option>
							{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
								<option key={l} value={l}>{l}</option>
							))}
						</select>

						{/* Teacher */}
						<select {...register("teacherId", { required: true })}
							className="w-full px-3 py-2 rounded-md border bg-card text-main">
							<option value="">Select Teacher</option>
							{teachers.map(t => (
								<option key={t._id} value={t._id}>
									{t.firstName} {t.lastName}
								</option>
							))}
						</select>

						<Input
							label="Academic Year"
							placeholder="2025-26"
							register={register}
							{...register("academicYear", { required: true })}
						/>

						<Input
							type="number"
							label="Capacity"
							register={register}
							{...register("capacity", { required: true, min: 1 })}
						/>

						<Button type="submit" className="w-full">
							{editingSection ? "Update Section" : "Add Section"}
						</Button>

						{editingSection && (
							<Button
								variant="danger"
								className="w-full"
								onClick={() => {
									reset();
									setEditingSection(null);
								}}
							>
								Cancel
							</Button>
						)}

						{errors.root && (
							<p className="text-red-500 text-center">
								{errors.root.message}
							</p>
						)}
					</form>
				</div>
			)}

			{/* Table */}
			{selectedCourse && (
				<div className="bg-card w-full rounded-lg shadow overflow-x-scroll">

					<table className="w-full">
						<thead className="bg-primary text-white">
							<tr>
								<th className="p-3 text-center">Section</th>
								<th className="p-3 text-center">Teacher</th>
								<th className="p-3 text-center">Year</th>
								<th className="p-3 text-center">Capacity</th>
								<th className="p-3 text-center">Action</th>
							</tr>
						</thead>

						<tbody>
							{sections.map(s => (
								<tr key={s._id} className="border-b hover:bg-[rgb(var(--secondary))]">
									<td className="p-3 text-center">{s.sectionName}</td>
									<td className="p-3 text-center">
										{s.teacher.firstName} {s.teacher.lastName}
									</td>
									<td className="p-3 text-center">{s.academicYear}</td>
									<td className="p-3 text-center">{s.capacity}</td>

									<td className="flex gap-4 justify-center p-3">
										<Button size="sm" className="!bg-green-500" onClick={() => handleEdit(s)}>
											<SquarePen size={16} />
										</Button>

										<Button size="sm" variant="danger" onClick={() => handleDelete(s)}>
											<Trash size={16} />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{selectedCourse && (
				<div className="flex justify-center gap-4">
					<Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
						Prev
					</Button>

					<span>Page {page} / {totalPages}</span>

					<Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
						Next
					</Button>
				</div>
			)}

		</div>
	);
};

export default Sections;
