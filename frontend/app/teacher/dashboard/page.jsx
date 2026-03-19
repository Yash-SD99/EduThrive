"use client"
import React from 'react'
import { useRouter } from 'next/navigation';

const dashboard = () => {
  
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    })

    router.replace("/"); //Used replace instead of push So that user cant go back using back arrow
  };

  return (
    <div>
      Teacher dashboard

      <button className='h-16 w-16 bg-rose-500 text-white' onClick={handleLogout}>Log Out</button>
    </div>
  )
}

export default dashboard