"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface VerifyAccountProps {
  initialUsername?: string | null
}

export default function VerifyAccount({ initialUsername = null }: VerifyAccountProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: initialUsername || "",
    confirmation_code: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!initialUsername) {
      const savedUsername = localStorage.getItem("temp_username")
      if (savedUsername) {
        setFormData((prev) => ({
          ...prev,
          username: savedUsername,
        }))
      }
    }
  }, [initialUsername])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post("http://localhost:8000/api/v1/auth/verify", formData)

      setSuccess("Account verificato con successo! Ora puoi accedere.")
      console.log("Success:", response.data)

      localStorage.removeItem("temp_username")
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || "Si è verificato un errore durante la verifica")
      } else {
        setError("Errore nella richiesta di verifica")
      }
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = () => {
    router.push("/login")
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verifica Account</CardTitle>
        <CardDescription className="text-center">
          Inserisci il codice di verifica ricevuto via email per attivare il tuo account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
            <Button onClick={goToLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              Vai al login
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="focus:ring-2 focus:ring-blue-500"
                  required
                  readOnly={!!formData.username}
                />
                <p className="text-xs text-gray-500">Inserisci il tuo username</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation_code">Codice di verifica</Label>
                <Input
                  id="confirmation_code"
                  name="confirmation_code"
                  value={formData.confirmation_code}
                  onChange={handleChange}
                  className="focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500">Inserisci il codice di verifica ricevuto via email</p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  "Verifica Account"
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-center text-sm text-gray-600">
          Non hai ricevuto il codice?{" "}
          <button className="font-medium text-blue-600 hover:text-blue-800">Invia di nuovo</button>
        </p>
      </CardFooter>
    </Card>
  )
}
