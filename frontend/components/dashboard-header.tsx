"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Settings, LogOut, Headphones, User } from "lucide-react"

export default function DashboardHeader() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const authTokens = localStorage.getItem("auth_tokens")
    if (!authTokens) {
      router.push("/login")
      return
    }

    try {
      // You might want to extract the username from the token or from a user profile API
      // For now, we'll just set a placeholder
      setUsername("Utente")
    } catch (error) {
      console.error("Error parsing auth tokens:", error)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("auth_tokens")
    router.push("/login")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded-full">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-600">Hearly</span>
        </Link>

        <div className="flex items-center space-x-4">
          {username && (
            <div className="hidden md:flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              <span>{username}</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Impostazioni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/account" className="cursor-pointer">
                  Impostazioni
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
