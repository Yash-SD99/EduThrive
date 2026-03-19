"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import Button from "./ui/Button"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.classList.add("dark")
      setDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
    setDark(!dark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="
          relative flex items-center justify-center
          w-10 h-10 rounded-full
          bg-primary
          text-white
          transition-all duration-300
          hover:scale-110 active:scale-95
        "
    >
      <div
        className={`
      transition-all duration-500 transform
      ${dark ? "rotate-180 scale-100" : "rotate-0 scale-100"}
    `}
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </div>
    </button>
  )
}