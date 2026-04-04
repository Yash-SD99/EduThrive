"use client"

import { useEffect, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"
import Button from "@/components/ui/Button"
import { useRouter, usePathname, useParams } from "next/navigation"

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { code } = useParams()

  const [sectionInfo, setSectionInfo] = useState(null)

  useEffect(() => {
    const updateSection = () => {
      const section = localStorage.getItem("selectedSection")
      setSectionInfo(section ? JSON.parse(section) : null)
    }
    updateSection()
    window.addEventListener("storage", updateSection)
    return () => window.removeEventListener("storage", updateSection)
  }, [pathname])

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
    if (pathname.includes("assessments")) return "Assessments"
    if (pathname.includes("marks")) return "Marks"
    if (pathname.includes("attendance")) return "Attendance"
    if (pathname.includes("students")) return "Students"
    if (pathname.includes("sections")) return "Sections"
    if (pathname.includes("profile")) return "Profile"
    return "Dashboard"
  }

  const shouldShowSection =
    sectionInfo &&
    !pathname.includes("dashboard") &&
    !pathname.includes("profile") &&
    !pathname.endsWith("/sections")

  return (
    <div className="h-[10vh] md:left-[260px] left-0 bg-card flex items-center top-0 right-0 px-4 border-b">
      <div className="flex flex-col md:ml-0 ml-[50]">
        <div className="text-main text-xl font-semibold leading-tight">
          {getPageTitle()}
        </div>
        {shouldShowSection && (
          <div className="max-w-[220px] truncate text-sm text-muted leading-tight">
            {sectionInfo.course?.name} - {sectionInfo.sectionName}
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <Button variant="danger" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  )
}

export default Navbar