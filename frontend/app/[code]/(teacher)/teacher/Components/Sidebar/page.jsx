"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useParams } from "next/navigation"
import Image from "next/image"

import {
	Menu, X, LayoutDashboard, Blocks, ArrowBigLeft,
	UserRound, ClipboardList, ClipboardCheck,
	CalendarCheck, Users, ArrowLeftRight
} from "lucide-react"

const Sidebar = () => {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()
	const router = useRouter()
	const { code } = useParams()

	const [role, setRole] = useState(null)
	const [selectedSection, setSelectedSection] = useState(null)

	useEffect(() => {
		setRole(localStorage.getItem("role"))
	}, [])

	useEffect(() => {
		const section = localStorage.getItem("selectedSection")
		setSelectedSection(section ? JSON.parse(section) : null)
	}, [pathname])

	const handleBack = () => {
		localStorage.removeItem("selectedSection")
		setSelectedSection(null)
		router.push(`/${code}/teacher/sections`)
	}

	const commonTop = [
		{ title: "Dashboard", href: `/${code}/teacher/dashboard`, icon: LayoutDashboard },
	]

	const commonBottom = [
		{ title: "Profile", href: `/${code}/teacher/profile`, icon: UserRound },
	]

	const viewAsHod = [
		{ title: "View As HOD", href: `/${code}/hod/dashboard`, icon: ArrowLeftRight },
	]

	const noSectionMenu = [
		{ title: "Sections", href: `/${code}/teacher/sections`, icon: Blocks },
	]

	const sectionMenu = [
		{ title: "Back to Sections", onClick: handleBack, icon: ArrowBigLeft },
		{ title: "Assessments", href: `/${code}/teacher/sections/${selectedSection?._id}/assessments`, icon: ClipboardList },
		{ title: "Marks", href: `/${code}/teacher/sections/${selectedSection?._id}/marks`, icon: ClipboardCheck },
		{ title: "Attendance", href: `/${code}/teacher/sections/${selectedSection?._id}/attendance`, icon: CalendarCheck },
		{ title: "Students", href: `/${code}/teacher/sections/${selectedSection?._id}/students`, icon: Users },
	]

	const middleMenu = selectedSection ? sectionMenu : noSectionMenu

	const linkClass = (href) => {
		const isActive = href && (pathname === href || pathname.startsWith(href + "/"))
		return `flex items-center gap-3 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white
      ${isActive ? "bg-[rgb(var(--primary))] text-white" : "hover:bg-muted"}`
	}

	return (
		<>
			<button className="md:hidden fixed z-50 bg-card p-2 top-4 left-4 rounded-md" onClick={() => setOpen(true)}>
				<Menu className="h-8 w-8" />
			</button>

			{open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}

			<div className={`fixed md:static top-0 left-0 min-h-screen w-[260px] bg-card border-r z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
			>
				<div className="md:hidden flex justify-end p-4">
					<button onClick={() => setOpen(false)}><X size={22} /></button>
				</div>

				<div className="relative w-full h-[150px]">
					<Image src="/logo.svg" fill alt="EduThrive Logo" className="object-contain" priority />
				</div>

				<nav className="flex flex-col gap-2 p-4 text-main">
					{commonTop.map((item, i) => (
						<Link key={i} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
							<item.icon size={18} /><span>{item.title}</span>
						</Link>
					))}

					<div className="bg-secondary rounded-md">
						{middleMenu.map((item, i) => {
							if (item.onClick) {
								return (
									<button key={i} onClick={() => { item.onClick(); setOpen(false) }}
										className="w-full flex items-center gap-2 px-4 py-2 rounded-md transition hover:bg-[rgb(var(--primary))] hover:text-white"
									>
										<item.icon size={18} /><span>{item.title}</span>
									</button>
								)
							}
							return (
								<Link key={i} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
									<item.icon size={18} /><span>{item.title}</span>
								</Link>
							)
						})}
					</div>

					{commonBottom.map((item, i) => (
						<Link key={i} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
							<item.icon size={18} /><span>{item.title}</span>
						</Link>
					))}

					{role === "hod" && (
						<div className="bg-secondary rounded-md">
							{viewAsHod.map((item, i) => (
								<Link key={i} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
									<item.icon size={18} /><span>{item.title}</span>
								</Link>
							))}
						</div>
					)}
				</nav>
			</div>
		</>
	)
}

export default Sidebar