"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
    const router = useRouter();
    const [serverResult, setServerResult] = useState(null);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();

    // Live preview helpers
    const rawCode = watch("instituteCode", "");
    const rawFirstName = watch("firstName", "");
    const rawLastName = watch("lastName", "");

    const previewCode = rawCode.trim().toUpperCase();
    const previewEmail =
        rawFirstName || rawLastName
            ? `${rawFirstName.trim().toLowerCase().replace(/\s+/g, "")}_${rawLastName
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "")}@${previewCode.toLowerCase()}.edu`
            : "";

    // ── Submit ──
    const onSubmit = async (formData) => {
        setServerError("");
        setServerResult(null);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/institute/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        instituteName: formData.instituteName,
                        instituteCode: formData.instituteCode.trim().toUpperCase(),
                        address: formData.address,
                        establishedYear: formData.establishedYear,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                    }),
                }
            );

            const data = await res.json();

            if (!data.success) {
                setServerError(data.message || "Registration failed.");
                return;
            }

            setServerResult(data.data);
        } catch {
            setServerError("Network error. Please try again.");
        }
    };

    // ── Success screen ──
    if (serverResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-main px-4">

                {/* Theme toggle fixed */}
                <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg">

                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-main">EduThrive</h1>
                        <p className="text-sm opacity-70 mt-1">
                            Institute Registered Successfully
                        </p>
                        <p className="text-xs opacity-50 mt-1 uppercase tracking-widest">
                            {serverResult.instituteCode}
                        </p>
                    </div>

                    {/* Credentials card */}
                    <div className="bg-background rounded-lg border p-4 space-y-3 mb-6">
                        <CredRow label="Institute" value={serverResult.instituteName} />
                        <CredRow label="Code" value={serverResult.instituteCode} />
                        <CredRow label="Email" value={serverResult.directorEmail} mono />
                        <CredRow label="Password" value={serverResult.defaultPassword} mono />
                        <CredRow label="Login URL" value={serverResult.loginUrl} mono />
                    </div>

                    <p className="text-xs text-main opacity-40 text-center mb-5">
                        Save these credentials. The director must log in and change their password on first use.
                    </p>

                    {/* Go to login */}
                    <Button
                        className="w-full"
                        onClick={() => router.push(`/${serverResult.instituteCode}`)}
                    >
                        Go to Login →
                    </Button>

                    <p className="mt-5 text-center text-sm opacity-60">
                        <Link href="/" className="hover:opacity-80 transition">
                            ← Back to home
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    // ── Registration form ──
    return (
        <div className="min-h-screen bg-background text-main px-4 py-10">

            {/* Theme toggle fixed */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md mx-auto">

                {/* Header — same pattern as login page */}
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-main">EduThrive</h1>
                    <p className="text-sm opacity-70 mt-1">
                        Institute Scale Learning Analytics Platform
                    </p>
                    <p className="text-xs opacity-50 mt-1">
                        Register your institution to get started
                    </p>
                </div>

                {/* Card — same as login card */}
                <div className="bg-card p-8 rounded-xl shadow-lg space-y-6">

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* ── INSTITUTE DETAILS section label ── */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-main opacity-40 mb-4">
                                Institute Details
                            </p>

                            <div className="space-y-4">

                                <Input
                                    label="Institute Name"
                                    name="instituteName"
                                    placeholder="e.g. D.Y. Patil College of Engineering"
                                    register={register}
                                    {...register("instituteName", {
                                        required: "Institute name is required",
                                    })}
                                    error={errors.instituteName?.message}
                                />

                                {/* Institute Code */}
                                <div className="space-y-1">
                                    <Input
                                        label="Institute Code"
                                        name="instituteCode"
                                        placeholder="e.g. DYPCOE"
                                        register={register}
                                        {...register("instituteCode", {
                                            required: "Institute code is required",
                                            pattern: {
                                                value: /^[A-Za-z0-9]+$/,
                                                message: "Alphanumeric only — no spaces or symbols",
                                            },
                                            minLength: { value: 2, message: "Minimum 2 characters" },
                                            maxLength: { value: 12, message: "Maximum 12 characters" },
                                        })}
                                        error={errors.instituteCode?.message}
                                    />
                                    {previewCode && (
                                        <p className="text-xs text-main opacity-40">
                                            Stored as:{" "}
                                            <span className="font-mono font-semibold">{previewCode}</span>
                                        </p>
                                    )}
                                </div>

                                <Input
                                    label="Address"
                                    name="address"
                                    placeholder="Full address of the institute"
                                    register={register}
                                    {...register("address", { required: "Address is required" })}
                                    error={errors.address?.message}
                                />

                                <Input
                                    label="Established Year"
                                    name="establishedYear"
                                    type="number"
                                    placeholder="e.g. 1998"
                                    register={register}
                                    {...register("establishedYear", {
                                        required: "Established year is required",
                                        min: { value: 1800, message: "Year must be after 1800" },
                                        max: {
                                            value: new Date().getFullYear(),
                                            message: "Cannot be a future year",
                                        },
                                    })}
                                    error={errors.establishedYear?.message}
                                />

                            </div>
                        </div>

                        {/* ── DIRECTOR DETAILS section label ── */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-main opacity-40 mb-4">
                                Director Details
                            </p>

                            <div className="space-y-4">

                                {/* Name row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="First Name"
                                        name="firstName"
                                        placeholder="First"
                                        register={register}
                                        {...register("firstName", {
                                            required: "First name is required",
                                        })}
                                        error={errors.firstName?.message}
                                    />
                                    <Input
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Last"
                                        register={register}
                                        {...register("lastName", {
                                            required: "Last name is required",
                                        })}
                                        error={errors.lastName?.message}
                                    />
                                </div>

                                {/* Phone */}
                                <Input
                                    label="Phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    register={register}
                                    {...register("phone", {
                                        required: "Phone number is required",
                                        pattern: {
                                            value: /^\+?[1-9]\d{7,14}$/,
                                            message: "Enter a valid phone number",
                                        },
                                    })}
                                    error={errors.phone?.message}
                                />

                                {/* Generated credential preview */}
                                {previewEmail && (
                                    <div className="bg-background rounded-md border px-3 py-2 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-main opacity-40">Generated email</span>
                                            <span className="text-xs font-mono text-main">{previewEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-main opacity-40">Default password</span>
                                            <span className="text-xs font-mono text-main">Pass@123</span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* ── Server error ── */}
                        {serverError && (
                            <p className="text-red-500 text-sm text-center">{serverError}</p>
                        )}

                        {/* ── Submit ── */}
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Registering..." : "Register Institute"}
                        </Button>

                    </form>

                    {/* Footer link — same as login */}
                    <p className="text-center text-sm opacity-60">
                        Already registered?{" "}
                        <Link href="/" className="hover:opacity-80 transition underline underline-offset-2">
                            Access your institute
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}

// ── Helper for the success credential rows ──
function CredRow({ label, value, mono = false }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-sm text-main opacity-40 shrink-0">{label}</span>
            <span
                className={`text-right break-all text-main ${mono ? "font-mono text-xs" : "text-sm font-medium"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}