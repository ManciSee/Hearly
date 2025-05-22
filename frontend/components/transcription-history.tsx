"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Eye, Download, FileText, Trash2 } from "lucide-react"

// Mock data for transcriptions
const mockTranscriptions = [
  {
    id: "1",
    title: "Intervista con Mario Rossi",
    date: "2023-05-15T10:30:00",
    duration: "25:42",
    fileSize: "12.5 MB",
  },
  {
    id: "2",
    title: "Riunione di progetto",
    date: "2023-05-10T14:15:00",
    duration: "48:17",
    fileSize: "23.8 MB",
  },
  {
    id: "3",
    title: "Conferenza annuale",
    date: "2023-04-28T09:00:00",
    duration: "01:12:33",
    fileSize: "35.2 MB",
  },
  {
    id: "4",
    title: "Note vocali personali",
    date: "2023-04-15T18:45:00",
    duration: "08:55",
    fileSize: "4.3 MB",
  },
]

export default function TranscriptionHistory() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [transcriptions, setTranscriptions] = useState(mockTranscriptions)

  const filteredTranscriptions = transcriptions.filter((transcription) =>
    transcription.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleDelete = (id: string) => {
    setTranscriptions(transcriptions.filter((t) => t.id !== id))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Storico trascrizioni</CardTitle>
            <CardDescription>Gestisci le tue trascrizioni precedenti</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Cerca trascrizioni..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTranscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Durata</TableHead>
                  <TableHead className="hidden md:table-cell">Dimensione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranscriptions.map((transcription) => (
                  <TableRow key={transcription.id}>
                    <TableCell className="font-medium">{transcription.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(transcription.date)}</TableCell>
                    <TableCell className="hidden md:table-cell">{transcription.duration}</TableCell>
                    <TableCell className="hidden md:table-cell">{transcription.fileSize}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
                          <Link href={`/transcription/${transcription.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizza</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden sm:inline-flex"
                          onClick={() => alert("Download trascrizione")}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Scarica trascrizione</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden sm:inline-flex"
                          onClick={() => alert("Download riassunto")}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Scarica riassunto</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden sm:inline-flex text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(transcription.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Elimina</span>
                        </Button>

                        {/* Mobile dropdown menu */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Azioni</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/transcription/${transcription.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Visualizza</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alert("Download trascrizione")}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Scarica trascrizione</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alert("Download riassunto")}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Scarica riassunto</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(transcription.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Elimina</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery
                ? "Nessuna trascrizione trovata con questo termine di ricerca."
                : "Non hai ancora trascrizioni. Carica un file audio per iniziare."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
