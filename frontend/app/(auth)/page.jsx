"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input.jsx"
import Button from "@/components/ui/Button";

export default function LoginPage() {
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm();

	const router = useRouter();

	const onSubmit = async (data) => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include", //for cookies
					body: JSON.stringify(data),
				}
			);

			const result = await res.json();

			if (!res.ok) {
				setError("root", {
					type: "server",
					message: result.message || "Something went wrong",
				});
				return;
			}

			const allowedRoles = ["student", "teacher", "hod", "director"];

			if (!allowedRoles.includes(result.role)) {
				setError("root", { message: "Invalid user role" });
				return;
			}

			localStorage.setItem("role", result.role)

			router.push(`/${result.role}/dashboard`);
		} catch (error) {
			setError("root", {
				message: "Network error. Please try again.",
			});
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background text-main px-4">
			<div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg">

				{/* Header */}
				<div className="mb-6 text-center">
					<h1 className="text-3xl font-bold text-main">
						EduThrive
					</h1>
					<p className="text-sm opacity-70 mt-1">
						Institute Scale Learning Analytics Platform
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

					{/* Role */}
					<div className="space-y-1">
						<label className="text-sm font-semibold">Role</label>
						<select
							{...register("role", { required: true })}
							className=" w-full px-3 py-2 rounded-md border bg-card text-main border-[rgb(var(--text)/0.2)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]">
							<option value="">Select role</option>
							<option value="director">Director</option>
							<option value="hod">HOD</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
						</select>
						{errors.role && (
							<p className="text-sm text-red-500">Role is required</p>
						)}
					</div>

					{/* Email */}
					<Input
						label="Email"
						type="email"
						name="email"
						placeholder="you@institute.edu"
						register={register}
						{...register("email", { required: "Email is required" })}
						error={errors.email?.message}
					/>

					{/* Password */}
					<Input
						label="Password"
						type="password"
						name="password"
						placeholder="••••••••"
						{...register("password", { required: "Password is required" })}
						register={register}
						error={errors.password?.message}
					/>

					{/* Submit */}
					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? "Logging in..." : "Login"}
					</Button>

					{errors.root && (
						<p className="text-sm text-center text-red-500">
							{errors.root.message}
						</p>
					)}
				</form>

				{/* Footer */}
				<p className="mt-6 text-center text-sm opacity-60">
					Contact administrator for account access
				</p>
			</div>
		</div>
	)
}