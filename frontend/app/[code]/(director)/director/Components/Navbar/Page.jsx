"use client"
import ThemeToggle from "@/components/ThemeToggle"
import Button from "@/components/ui/Button"
import { useRouter, usePathname, useParams } from "next/navigation"

const Navbar = () => {
	const router = useRouter()
	const pathname = usePathname()
	const { code } = useParams()

	const handleLogout = async () => {
		await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
			method: "POST",
			credentials: "include"
		})
		localStorage.removeItem("role")
		localStorage.removeItem("instituteCode")
		router.replace(`/${code}`)
	}

	const getPageTitle = () => {
		if (pathname.includes("dashboard")) return "Dashboard"
		if (pathname.includes("departments")) return "Departments"
		if (pathname.includes("students")) return "Students"
		if (pathname.includes("teachers")) return "Teachers"
		if (pathname.includes("profile")) return "Profile"
		return "Dashboard"
	}

	return (
		<div className="h-[10vh] md:left-[260px] left-0 bg-card flex items-center top-0 right-0 px-4 border-b">
			<div className="text-main text-xl md:ml-0 ml-[75] font-semibold mr-1">
				{getPageTitle()}
			</div>
			<div className="ml-auto flex items-center gap-3">
				<ThemeToggle />
				<Button variant="danger" onClick={handleLogout}>Log Out</Button>
			</div>
		</div>
	)
}

export default Navbar