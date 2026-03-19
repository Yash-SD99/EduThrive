"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const Profile = () => {
	const [director, setDirector] = useState(null);

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting },
	} = useForm();

	const {
		register: registerInstitute,
		handleSubmit: handleInstituteSubmit,
		reset: resetInstitute,
		formState: { isSubmitting: isInstSubmitting },
	} = useForm();

	const {
		register: registerPassword,
		handleSubmit: handlePasswordSubmit,
		reset: resetPassword,
	} = useForm();

	// =============================
	// FETCH PROFILE
	// =============================
	const fetchProfile = async () => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile`,
				{ credentials: "include" }
			);

			const data = await res.json();
			console.log(data)

			if (data.success) {
				const d = data.data;

				setDirector(d);

				reset({
					firstName: d.firstName || "",
					lastName: d.lastName || "",
					phone: d.phone || "",
					gender: d.gender || "",
					email: d.email || "",
					dateOfBirth: d.dateOfBirth?.slice(0, 10) || "",
					joiningDate: d.joiningDate?.slice(0, 10) || "",
				});

				resetInstitute({
					name: d.institute?.name || "",
					code: d.institute?.code || "",
					address: d.institute?.address || "",
					establishedYear: d.institute?.establishedYear || "",
				});
			}
		} catch (err) {
			toast.error("Failed to load profile");
		}
	};

	useEffect(() => {
		fetchProfile();
	}, []);

	// =============================
	// UPDATE DIRECTOR
	// =============================
	const onSubmit = async (formData) => {
		const promise = fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(formData),
			}
		).then((res) => res.json());

		toast.promise(promise, {
			loading: "Updating profile...",
			success: (data) => {
				if (!data.success) throw new Error(data.message);
				fetchProfile();
				return "Profile updated successfully";
			},
			error: (err) => err.message || "Update failed",
		});
	};

	// =============================
	// UPDATE INSTITUTE
	// =============================
	const onInstituteSubmit = async (formData) => {
		const promise = fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile/institute`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(formData),
			}
		).then((res) => res.json());

		toast.promise(promise, {
			loading: "Updating institute...",
			success: () => {
				fetchProfile();
				return "Institute updated successfully";
			},
			error: "Failed to update institute",
		});
	};

	// =============================
	// CHANGE PASSWORD
	// =============================
	const onPasswordSubmit = async (formData) => {
		const promise = fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile/change-password`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(formData),
			}
		).then((res) => res.json());

		toast.promise(promise, {
			loading: "Changing password...",
			success: (data) => {
				if (!data.success) throw new Error(data.message);
				resetPassword();
				return "Password changed successfully";
			},
			error: (err) => err.message || "Failed to change password",
		});
	};

	return (
		<div className="bg-background min-h-screen p-2 space-y-6 text-main">

			{/* Director */}
			<div className="bg-card p-6 rounded-lg shadow">
				<h2 className="text-xl font-semibold mb-4">Director Profile</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

					<Input name="firstName" label="First Name" register={register} />
					<Input name="lastName" label="Last Name" register={register} />
					<Input name="phone" label="Phone" register={register} />
					<Input name="gender" label="Gender" register={register} />
					<Input name="email" label="Email" register={register} disabled />
					<Input name="dateOfBirth" type="date" label="Date of Birth" register={register} />
					<Input name="joiningDate" type="date" label="Joining Date" register={register} />

					<Button type="submit" className="w-full">
						Update Profile
					</Button>
				</form>
			</div>

			{/* Institute */}
			<div className="bg-card p-6 rounded-lg shadow">
				<h2 className="text-xl font-semibold mb-4">Institute Details</h2>

				<form onSubmit={handleInstituteSubmit(onInstituteSubmit)} className="space-y-4">

					<Input name="name" label="Institute Name" register={registerInstitute} />
					<Input name="code" label="Code" register={registerInstitute} />
					<Input name="address" label="Address" register={registerInstitute} />
					<Input name="establishedYear" label="Established Year" register={registerInstitute} />

					<Button type="submit" className="w-full">
						Update Institute
					</Button>
				</form>
			</div>

			{/* Password */}
			<div className="bg-card p-6 rounded-lg shadow">
				<h2 className="text-xl font-semibold mb-4">Change Password</h2>

				<form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">

					<Input name="currentPassword" type="password" label="Current Password" register={registerPassword} />
					<Input name="newPassword" type="password" label="New Password" register={registerPassword} />

					<Button type="submit" className="w-full">
						Change Password
					</Button>
				</form>
			</div>

		</div>
	);
};

export default Profile;