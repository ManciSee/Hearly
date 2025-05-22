import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardHeader from "@/components/dashboard-header"
import { ArrowLeft, Save } from "lucide-react"

export const metadata: Metadata = {
  title: "Account | AudioScript",
  description: "Gestisci il tuo account",
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Impostazioni Account</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profilo</TabsTrigger>
            <TabsTrigger value="security">Sicurezza</TabsTrigger>
            <TabsTrigger value="billing">Abbonamento</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Profilo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" defaultValue="Utente" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Cognome</Label>
                    <Input id="surname" defaultValue="Demo" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="utente@esempio.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Azienda (opzionale)</Label>
                  <Input id="company" placeholder="Nome azienda" />
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salva modifiche
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sicurezza</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password attuale</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nuova password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma nuova password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Aggiorna password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Abbonamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Piano Gratuito</h3>
                        <p className="text-sm text-gray-500">Fino a 10 trascrizioni al mese, max 20 minuti ciascuna</p>
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Attivo</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6">
                        <h3 className="font-medium text-lg mb-2">Piano Pro</h3>
                        <div className="mb-4">
                          <span className="text-2xl font-bold">€9.99</span>
                          <span className="text-gray-500">/mese</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Trascrizioni illimitate
                          </li>
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            File fino a 2 ore
                          </li>
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Riassunti avanzati
                          </li>
                        </ul>
                        <Button className="w-full">Passa a Pro</Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6">
                        <h3 className="font-medium text-lg mb-2">Piano Business</h3>
                        <div className="mb-4">
                          <span className="text-2xl font-bold">€24.99</span>
                          <span className="text-gray-500">/mese</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Tutto del piano Pro
                          </li>
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            API per integrazioni
                          </li>
                          <li className="flex items-center text-sm">
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Supporto prioritario
                          </li>
                        </ul>
                        <Button className="w-full">Passa a Business</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
