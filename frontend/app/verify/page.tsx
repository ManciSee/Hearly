import type { Metadata } from "next"
import { Headphones } from "lucide-react"
import VerifyAccount from "@/components/verify-account"

export const metadata: Metadata = {
  title: "Verifica Account | Hearly",
  description: "Verifica il tuo account sulla piattaforma di trascrizione audio Hearly",
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-full">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-600">Hearly</span>
          </a>
        </div>

        <div className="max-w-md mx-auto">
          <VerifyAccount />
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Hearly. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  )
}
