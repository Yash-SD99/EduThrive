"use client"
import React from 'react'
import { useRouter } from 'next/navigation';

const dashboard = () => {
  
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/"); //Used replace instead of push So that user cant go back using back arrow 
  };

  return (
    <div>
      Hod dashboard

      <button className='h-16 w-16 bg-rose-500 text-white' onClick={handleLogout}>Log Out</button>
    </div>
  )
}

export default dashboard