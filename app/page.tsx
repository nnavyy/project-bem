'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard')
    }, 1500) // delay 1.5 detik untuk animasi

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        <p className="text-lg font-medium text-gray-700">Mengalihkan ke halaman dashboard...</p>
      </div>
    </div>
  )
}