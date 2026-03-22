"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"

import {
	Menu,
	X,
	LayoutDashboard,
	Blocks,
	ArrowBigLeft,
	UserRound,
	ClipboardList,
	ClipboardCheck,
	CalendarCheck,
	Users,
	ArrowLeftRight
} from "lucide-react"

const Sidebar = () => {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()
	const router = useRouter()

	const [role, setRole] = useState(null)

	useEffect(() => {
		const role = localStorage.getItem("role")
		setRole(role)
	}, [])

	const [selectedSection, setSelectedSection] = useState(null)

	// Sync section with route
	useEffect(() => {
		const section = localStorage.getItem("selectedSection")
		setSelectedSection(section ? JSON.parse(section) : null)
	}, [pathname])

	// Back to sections
	const handleBack = () => {
		localStorage.removeItem("selectedSection")
		setSelectedSection(null)
		router.push("/teacher/sections")
	}

	// =============================
	// MENUS
	// =============================

	const commonTop = [
		{
			title: "Dashboard",
			href: "/teacher/dashboard",
			icon: LayoutDashboard
		},
	]

	const commonBottom = [
		{
			title: "Profile",
			href: "/teacher/profile",
			icon: UserRound
		},
	]

	const viewAsHod = [
		{
			title: "View As HOD",
			href: "/hod/dashboard",
			icon: ArrowLeftRight
		},
	]

	const noSectionMenu = [
		{
			title: "Sections",
			href: `/teacher/sections`,
			icon: Blocks
		},
	]

	const sectionMenu = [
		{
			title: "Back to Sections",
			onClick: handleBack,
			icon: ArrowBigLeft
		},
		{
			title: "Assessments",
			href: `/teacher/sections/${selectedSection?._id}/assessments`,
			icon: ClipboardList
		},
		{
			title: "Marks",
			href: `/teacher/sections/${selectedSection?._id}/marks`,
			icon: ClipboardCheck
		},
		{
			title: "Attendance",
			href: `/teacher/sections/${selectedSection?._id}/attendance`,
			icon: CalendarCheck
		},
		{
			title: "Students",
			href: `/teacher/sections/${selectedSection?._id}/students`,
			icon: Users
		},
	]

	const middleMenu = selectedSection ? sectionMenu : noSectionMenu

	return (
		<>
			{/* Mobile Button */}
			<button
				className="md:hidden fixed z-50 bg-card p-2 top-4 left-4 rounded-md"
				onClick={() => setOpen(true)}
			>
				<Menu className="h-8 w-8" />
			</button>

			{/* Overlay */}
			{open && (
				<div
					className="fixed inset-0 bg-black/40 z-40 md:hidden"
					onClick={() => setOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`fixed md:static top-0 left-0 min-h-screen w-[260px] bg-card border-r z-50 transform transition-transform duration-300
				${open ? "translate-x-0" : "-translate-x-full"}
				md:translate-x-0`}
			>

				{/* Close */}
				<div className="md:hidden flex justify-end p-4">
					<button onClick={() => setOpen(false)}>
						<X size={22} />
					</button>
				</div>

				{/* Logo */}
				<div className="relative w-full h-[150px]">
					<Image
						src="/logo.svg"
						fill
						alt="EduThrive Logo"
						className="object-contain"
						priority
					/>
				</div>

				{/* Menu */}
				<nav className="flex flex-col gap-2 p-4 text-main">

					{/* TOP */}
					{commonTop.map((item, i) => {
						const Icon = item.icon
						const isActive = pathname.startsWith(item.href)

						return (
							<Link
								key={i}
								href={item.href}
								onClick={() => setOpen(false)}
								className={`flex items-center gap-3 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white
								${isActive
										? "bg-[rgb(var(--primary))] text-white"
										: "hover:bg-muted"}`}
							>
								<Icon size={18} />
								<span>{item.title}</span>
							</Link>
						)
					})}

					{/* MIDDLE */}
					<div className="bg-secondary rounded-md">
						{middleMenu.map((item, i) => {
							const Icon = item.icon

							const isActive =
								item.href &&
								(pathname === item.href ||
									pathname.startsWith(item.href + "/"))

							// If item has onClick (Back button)
							if (item.onClick) {
								return (
									<button
										key={i}
										onClick={() => {
											item.onClick()
											setOpen(false)
										}}
										className="w-full flex items-center gap-2 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white"
									>
										<Icon size={18} />
										<span>{item.title}</span>
									</button>
								)
							}

							return (
								<Link
									key={i}
									href={item.href}
									onClick={() => setOpen(false)}
									className={`flex items-center gap-3 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white
				${isActive
											? "bg-[rgb(var(--primary))] text-white"
											: "hover:bg-muted"}`}
								>
									<Icon size={18} />
									<span>{item.title}</span>
								</Link>
							)
						})}
					</div>

					{/* BOTTOM */}
					{commonBottom.map((item, i) => {
						const Icon = item.icon
						const isActive = pathname.startsWith(item.href)

						return (
							<Link
								key={i}
								href={item.href}
								onClick={() => setOpen(false)}
								className={`flex items-center gap-3 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white
								${isActive
										? "bg-[rgb(var(--primary))] text-white"
										: "hover:bg-muted"}`}
							>
								<Icon size={18} />
								<span>{item.title}</span>
							</Link>
						)
					})}

					{/* View Switch */}
					{role === "hod" &&
						(viewAsHod.map((item, i) => {
							const Icon = item.icon
							const isActive = pathname.startsWith(item.href)

							return (
								<Link
									key={i}
									href={item.href}
									onClick={() => setOpen(false)}
									className={`flex items-center gap-3 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white
								${isActive
											? "bg-[rgb(var(--primary))] text-white"
											: "hover:bg-muted"}`}
								>
									<Icon size={18} />
									<span>{item.title}</span>
								</Link>
							)
						}
						))
					}

				</nav>
			</div>
		</>
	)
}

export default Sidebar