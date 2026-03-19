"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

import {
	Menu,
	X,
	LayoutDashboard,
	Building2,
	Users,
	GraduationCap,
	UserRound
} from "lucide-react"

const Sidebar = () => {

	// Controls mobile sidebar open/close
	const [open, setOpen] = useState(false)

	// Get current route to highlight active link
	const pathname = usePathname()

	/*
	Navigation items
	*/
	const menuItems = [
		{
			title: "Dashboard",
			href: "/director/dashboard",
			icon: LayoutDashboard
		},
		{
			title: "Departments",
			href: "/director/departments",
			icon: Building2
		},
		{
			title: "Teachers",
			href: "/director/teachers",
			icon: Users
		},
		{
			title: "Students",
			href: "/director/students",
			icon: GraduationCap
		},
		{
			title: "Profile",
			href: "/director/profile",
			icon: UserRound
		},
	]

	return (
		<>
			{/* Mobile Hamburger Button */}
			<button
				className="md:hidden fixed z-50 bg-card p-2 top-4 left-4 rounded-md"
				onClick={() => setOpen(true)}
			>
				<Menu className="h-8 w-8"/>
			</button>

			{/* Mobile Overlay */}
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

				{/* Mobile Close Button */}
				<div className="md:hidden flex justify-end p-4">
					<button onClick={() => setOpen(false)}>
						<X size={22}/>
					</button>
				</div>

        {/* Logo Section */}
					<div className="relative w-full h-[150px]">
						<Image
							src="/logo.svg"
							fill
							alt="EduThrive Logo"
							className="object-contain"
						/>
					</div>


				{/* Sidebar Menu */}
				<nav className="flex flex-col gap-2 p-4 text-main">

					{menuItems.map((item, index) => {

						const Icon = item.icon

						// Check if route is active
						const isActive =
							pathname === item.href ||
							pathname.startsWith(item.href + "/")

						return (
							<Link
								key={index}
								href={item.href}
								onClick={() => setOpen(false)} // close sidebar on mobile
								className={`flex items-center gap-3 px-4 py-2 hover:bg-[rgb(var(--secondary))] rounded-md transition 
								
								${isActive
									? "bg-[rgb(var(--primary))] text-white"
									: "hover:bg-muted"}
								`}
							>

								<Icon size={18}/>

								<span>{item.title}</span>

							</Link>
						)
					})}

				</nav>

			</div>
		</>
	)
}

export default Sidebar