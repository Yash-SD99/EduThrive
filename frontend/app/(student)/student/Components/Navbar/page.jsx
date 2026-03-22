"use client"
import ThemeToggle from "@/components/ThemeToggle"
import Button from "@/components/ui/Button"
import { useRouter, usePathname } from "next/navigation"

const Navbar = () => {
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, 
            {
            method: "POST",
            credentials: "include"
        })

        localStorage.removeItem("role")

        router.replace("/")
    }

    // Convert route to title
    const getPageTitle = () => {
        if (pathname.includes("dashboard")) return "Dashboard"
        if (pathname.includes("enroll")) return "Enrollment"
        if (pathname.includes("courses")) return "My Courses"
        if (pathname.includes("profile")) return "Profile"

        return "Dashboard"
    }

    return (
        <div className="h-[10vh] md:left-[260px] left-0 bg-card flex items-center top-0 right-0 px-4 border-b">

            {/* Page Title */}
            <div className="text-main text-xl md:ml-0 ml-[75] font-semibold mr-1">
                {getPageTitle()}
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
                <ThemeToggle />
                <Button variant="danger" onClick={handleLogout}>Log Out</Button>
            </div>

        </div>
    )
}

export default Navbar