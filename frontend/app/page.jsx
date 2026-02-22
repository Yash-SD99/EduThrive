"use client";

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm()

	const router = useRouter()

	const onSubmit = async (data) => {
		try {
			const res = await fetch("http://localhost:5000/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include", // VERY IMPORTANT
			})

			const result = await res.json()

			//Login Failure like empty or invalid credentials
			if (!res.ok) {
				setError("root", {
					type: "server",
					message: result.message || "Something went wrong"
				})
				return
			}

			//successful login
			const allowedRoles = ["student", "teacher", "hod", "director"];

			if (!allowedRoles.includes(result.role)) {
				setError("root", { message: "Invalid user role" });
				return;
			}

			router.push(`/${result.role}/dashboard`)

		} catch (error) { //other network errors
			setError("root", { message: "Network error. Please try again." });
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-200">
			<div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">

				{/* Header */}
				<div className="mb-6 text-center">
					<h1 className="text-2xl font-bold">EduThrive</h1>
					<p className="text-sm text-gray-500">
						Institute Scale Learning Analytics Platform
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="flex items-center mb-4 gap-2">
						<label htmlFor="role" className="font-semibold">Role:</label>
						<select id="role" {...register("role", { required: true })} className="w-full p-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option value="">Please select role</option>
							<option value="director">Director</option>
							<option value="hod">Hod</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
						</select>
					</div>
					{errors.role && <p className="text-center text-sm font-bold text-red-500">Role is required</p>}

					<div className="flex items-center mb-4 gap-2">
						<label className="font-semibold">Email:</label>
						<input type="email"
							className="mt-1 w-full p-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="you@institute.edu"
							{...register("email", { required: true })} />
					</div>
					{errors.email && <p className="text-center text-sm font-bold text-red-500">Email is required</p>}

					<div className="flex items-center mb-4 gap-2">
						<label className="font-semibold">Password:</label><input type="password"
							className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="••••••••"
							{...register("password", { required: true })} />
					</div>
					{errors.password && <p className="text-center text-sm font-bold text-red-500">Password is required</p>}

					<input type="submit" value={isSubmitting ? "Logging in..." : "Login"} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition" />
					{errors.root && <p className="text-center text-sm font-bold text-red-500">{errors.root.message}</p>}
				</form>

				{/* Footer */}
				<p className="mt-6 text-center text-sm font-bold text-red-500">
					Contact administrator for account access
				</p>
			</div>
		</div>
	);
}
