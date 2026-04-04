"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    ChartNoAxesCombined,
    TriangleAlert,
    Building2,
    Copyright
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";

const features = [
    {
        Icon: LayoutDashboard,
        title: "Multi-Level Dashboards",
        desc: "Dedicated views for Students, Teachers, HODs, and Directors — each with contextual data.",
    },
    {
        Icon: ChartNoAxesCombined,
        title: "Academic Performance Analytics",
        desc: "Track marks, assessment trends, and outcomes across departments.",
    },
    {
        Icon: TriangleAlert,
        title: "Attendance & Early Warnings",
        desc: "Identify at-risk students using automated threshold alerts.",
    },
    {
        Icon: Building2,
        title: "Institute-Wide Governance",
        desc: "Directors get centralized oversight of performance and growth.",
    },
];

export default function LandingPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState("");

    const handleAccess = (e) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
            setCodeError("Please enter your institute code.");
            return;
        }
        setCodeError("");
        router.push(`/${trimmed}`);
    };

    return (
        <div className="min-h-screen bg-background text-main flex flex-col">

            {/* ================= NAVBAR ================= */}
            <nav className="sticky top-0 z-50 backdrop-blur bg-card/80 border-b border-[rgb(var(--text)/0.08)]">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8">
                            <Image src="/logo.svg" alt="EduThrive" fill className="object-contain" />
                        </div>
                        <span className="font-semibold text-lg">
                            EduThrive
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/register">
                            <Button size="sm">Register</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ================= HERO ================= */}
            <section className="flex-1 flex items-center">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">

                    {/* Left Content */}
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-[rgb(var(--primary))]">
                            Edu
                            <span className="text-green-500">
                                Thrive
                            </span>
                        </h1>

                        <p className="text-xs uppercase tracking-[0.2em] opacity-40 mb-4">
                            SaaS · Multi-Tenant · Analytics
                        </p>

                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                            Institute-Scale <br />
                            <span style={{ color: "rgb(var(--primary))" }}>
                                Learning Intelligence
                            </span>
                        </h1>

                        <p className="text-base md:text-lg opacity-60 mb-8 max-w-md">
                            Empower students, teachers, HODs, and directors with actionable academic insights.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register">
                                <Button size="lg">Register Your Institute</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Access Card */}
                    <div className="bg-card border border-[rgb(var(--text)/0.08)] rounded-xl p-8 shadow-sm">
                        <h3 className="text-lg font-semibold mb-2">
                            Access Your Institute
                        </h3>
                        <p className="text-sm opacity-50 mb-6">
                            Enter your institute code to continue.
                        </p>

                        <form onSubmit={handleAccess} className="space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setCodeError("");
                                }}
                                placeholder="e.g. DYPCOE"
                                className="w-full px-4 py-2 rounded-md border bg-background uppercase text-sm
                  border-[rgb(var(--text)/0.2)]
                  focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]
                  placeholder:normal-case placeholder:opacity-40"
                            />

                            {codeError && (
                                <p className="text-red-500 text-xs">{codeError}</p>
                            )}

                            <Button type="submit" className="w-full">
                                Continue →
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="bg-card border-t border-[rgb(var(--text)/0.08)] py-20">
                <div className="max-w-6xl mx-auto px-4 md:px-8">

                    <p className="text-xs uppercase tracking-[0.15em] opacity-40 text-center mb-12">
                        Platform Capabilities
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ Icon, title, desc }) => (
                            <div
                                key={title}
                                className="p-6 rounded-xl border border-[rgb(var(--text)/0.08)]
                  hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className="mb-4 w-10 h-10 rounded-md bg-[rgb(var(--primary)/0.08)]
                  flex items-center justify-center">
                                    <Icon size={20} style={{ color: "rgb(var(--primary))" }} />
                                </div>

                                <h3 className="font-semibold mb-2">{title}</h3>
                                <p className="text-sm opacity-60 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= DEMO SECTION ================= */}
            <section className="py-16 border-t border-[rgb(var(--text)/0.08)] bg-background">
                <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">

                    <h2 className="text-2xl font-semibold mb-3">
                        Try Demo Institute
                    </h2>

                    <p className="text-sm opacity-60 mb-10">
                        Explore EduThrive using demo accounts.
                        Use institute code <span className="font-semibold">INS001</span>
                    </p>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { role: "Director", email: "rajesh_sharma@ins001.edu", password: "Pass@123" },
                            { role: "HOD", email: "kunal_bandkar_cse@ins001.edu", password: "Pass@123" },
                            { role: "Teacher", email: "alakh_pandey_cse@ins001.edu", password: "Pass@123" },
                            { role: "Student", email: "cse00004@ins001.edu", password: "Pass@123" },
                        ].map((user) => (
                            <div
                                key={user.role}
                                className="p-5 bg-card border border-[rgb(var(--text)/0.08)]
            rounded-xl hover:shadow-md transition-all duration-200"
                            >
                                <p className="font-semibold mb-2">{user.role}</p>
                                <p className="text-xs opacity-60 mb-1">{user.email}</p>
                                <p className="text-xs opacity-50">Password: {user.password}</p>
                            </div>
                        ))}

                    </div>

                    <div className="mt-10">
                        <Link href="/INS001">
                            <Button size="lg">Login to Demo →</Button>
                        </Link>
                    </div>

                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="border-t border-[rgb(var(--text)/0.08)] py-6 text-center">
                <div className="text-xs opacity-40 flex items-center justify-center gap-[10px]">
                    <Copyright size={15} />
                    <p>{new Date().getFullYear()} EduThrive — Institute-Scale Learning Analytics Platform</p>
                </div>
            </footer>

        </div>
    );
}