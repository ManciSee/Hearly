"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Headphones, BarChart2, Settings, Home } from "lucide-react"

export default function DashboardHeader() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [initials, setInitials] = useState<string>("U")

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
      setInitials("U")

      // In a real implementation, you would get the user's name and set the initials
      // For example:
      // const user = JSON.parse(authTokens).user
      // setUsername(user.username)
      // setInitials(`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`)
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 p-0">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Profilo utente</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/statistics" className="cursor-pointer flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Statistiche
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account" className="cursor-pointer flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
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
