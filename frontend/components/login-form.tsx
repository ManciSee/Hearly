"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface LoginFormProps {
  onLoginSuccess?: (tokens: any) => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps = {}) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post("http://localhost:8000/api/v1/auth/signin", {
        username: identifier,
        password: password,
      })

      localStorage.setItem("auth_tokens", JSON.stringify(response.data))

      if (onLoginSuccess) {
        onLoginSuccess(response.data)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || "Si è verificato un errore durante l'accesso")
      } else {
        setError("Errore nella richiesta di login")
      }
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Accedi a Hearly</CardTitle>
        <CardDescription className="text-center">
          Inserisci le tue credenziali per accedere alla piattaforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email o Username</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Il tuo email o username"
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Password dimenticata?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              "Accedi"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">oppure</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Non hai un account?{" "}
          <a href="/signup" className="font-medium text-blue-600 hover:text-blue-800">
            Registrati
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
