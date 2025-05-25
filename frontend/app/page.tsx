"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowRight, FileText, Headphones, Sparkles, LogOut, BarChart2, Settings, Home } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [initials, setInitials] = useState<string>("U")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check if user is logged in
    const authTokens = localStorage.getItem("auth_tokens")
    if (authTokens) {
      setIsLoggedIn(true)
      try {
        // In a real implementation, you would get the user's name from the token
        // For now, we'll just set a placeholder
        setUsername("Utente")
        setInitials("U")
      } catch (error) {
        console.error("Error parsing auth tokens:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_tokens")
    setIsLoggedIn(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-full">
              <Headphones className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">Hearly</span>
          </div>
          <div className="flex items-center space-x-4">
            {isClient && isLoggedIn ? (
              <>
                
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
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Accedi</Button>
                </Link>
                <Link href="/signup">
                  <Button>Registrati</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Trasforma i tuoi audio in testo con l'IA</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Trascrivi, riassumi e analizza qualsiasi file audio in pochi secondi grazie alla nostra tecnologia avanzata
            di riconoscimento vocale.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isClient && isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
                  Vai alla dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
                    Prova gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Accedi
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Funzionalità principali</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trascrizione accurata</h3>
              <p className="text-gray-600">
                Converti qualsiasi file audio in testo con una precisione superiore al 95%, supportando più lingue.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Riassunti intelligenti</h3>
              <p className="text-gray-600">
                Ottieni automaticamente riassunti delle tue trascrizioni, evidenziando i punti chiave.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Esportazione facile</h3>
              <p className="text-gray-600">
                Esporta le tue trascrizioni in diversi formati e condividile facilmente con i tuoi collaboratori.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto a iniziare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {isClient && isLoggedIn
              ? "Torna alla dashboard per gestire le tue trascrizioni."
              : "Registrati oggi e ottieni 60 minuti di trascrizione gratuita."}
          </p>
          {isClient && isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100 border-white">
                Vai alla dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100 border-white">
                Inizia ora
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                <Headphones className="h-5 w-5 mr-2" />
                Hearly
              </h3>
              <p className="text-sm">
                La soluzione più avanzata per la trascrizione audio basata su intelligenza artificiale.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Prezzi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Risorse</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentazione
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Supporto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Chi siamo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contatti
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Hearly. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
