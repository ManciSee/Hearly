import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard-header"
import { ArrowLeft, Copy, Download, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Dettaglio Trascrizione | AudioScript",
  description: "Visualizza la trascrizione completa e il riassunto",
}

// Mock data for a single transcription
const mockTranscription = {
  id: "1",
  title: "Intervista con Mario Rossi",
  date: "2023-05-15T10:30:00",
  duration: "25:42",
  fileSize: "12.5 MB",
  transcription: `
    [00:00:00] Intervistatore: Buongiorno e benvenuti a questa intervista con Mario Rossi, esperto di intelligenza artificiale. Mario, grazie per essere qui con noi oggi.
    
    [00:00:15] Mario Rossi: Grazie a voi per l'invito, è un piacere essere qui.
    
    [00:00:20] Intervistatore: Per iniziare, potresti spiegarci brevemente cosa si intende per intelligenza artificiale e come sta cambiando il nostro mondo?
    
    [00:00:30] Mario Rossi: Certamente. L'intelligenza artificiale, o IA, è essenzialmente la capacità di un sistema informatico di svolgere compiti che normalmente richiederebbero l'intelligenza umana. Questo include l'apprendimento, il ragionamento, la risoluzione di problemi, la percezione e la comprensione del linguaggio.
    
    [00:01:00] Mario Rossi: Per quanto riguarda come sta cambiando il nostro mondo, l'impatto è già enorme e continua a crescere. L'IA sta trasformando settori come la sanità, dove aiuta nella diagnosi precoce di malattie; i trasporti, con lo sviluppo di veicoli autonomi; l'istruzione, personalizzando l'apprendimento; e praticamente ogni aspetto della nostra vita quotidiana, dai suggerimenti di Netflix alle risposte di Siri o Alexa.
    
    [00:01:45] Intervistatore: Interessante. E quali sono le sfide etiche più significative che dobbiamo affrontare con l'avanzamento dell'IA?
    
    [00:02:00] Mario Rossi: Le sfide etiche sono numerose e complesse. Una delle principali riguarda la privacy e la protezione dei dati, poiché i sistemi di IA richiedono enormi quantità di dati per funzionare efficacemente. C'è anche la questione della trasparenza algoritmica: come possiamo garantire che le decisioni prese dall'IA siano comprensibili e giustificabili?
    
    [00:02:30] Mario Rossi: Poi abbiamo preoccupazioni riguardo ai pregiudizi e alla discriminazione. Se i dati utilizzati per addestrare un sistema di IA contengono pregiudizi sociali esistenti, l'IA potrebbe perpetuare o addirittura amplificare questi pregiudizi.
    
    [00:03:00] Mario Rossi: Infine, c'è la questione dell'impatto sul lavoro. Mentre l'IA crea nuove opportunità di lavoro, sta anche automatizzando molti compiti tradizionalmente svolti dagli esseri umani. Dobbiamo pensare a come gestire questa transizione in modo che i benefici dell'IA siano distribuiti equamente nella società.
    
    [00:03:30] Intervistatore: Guardando al futuro, quali sviluppi dell'IA ti entusiasmano di più?
    
    [00:03:40] Mario Rossi: Sono particolarmente entusiasta del potenziale dell'IA nel risolvere alcune delle sfide più urgenti dell'umanità. Ad esempio, l'IA sta già aiutando nella ricerca sul cambiamento climatico, modellando scenari complessi e ottimizzando l'uso delle risorse. Nel campo della medicina, l'IA potrebbe accelerare la scoperta di nuovi farmaci e trattamenti personalizzati.
    
    [00:04:15] Mario Rossi: Sono anche ottimista riguardo ai progressi nell'IA generale, che potrebbe un giorno avvicinarsi all'intelligenza umana in termini di flessibilità e capacità di apprendimento. Questo potrebbe portare a progressi scientifici e tecnologici che oggi possiamo a malapena immaginare.
    
    [00:04:45] Intervistatore: Grazie, Mario, per queste riflessioni illuminanti sull'intelligenza artificiale. È stato un piacere averti con noi.
    
    [00:04:55] Mario Rossi: Grazie a voi per l'opportunità di discutere di questi argomenti così importanti.
  `,
  summary: `
    In questa intervista, Mario Rossi, esperto di intelligenza artificiale, discute l'impatto dell'IA sulla società moderna. Definisce l'IA come la capacità dei sistemi informatici di svolgere compiti che normalmente richiederebbero l'intelligenza umana, evidenziando come stia trasformando settori come sanità, trasporti e istruzione.
    
    Rossi affronta le principali sfide etiche dell'IA, tra cui privacy, trasparenza algoritmica, pregiudizi nei dati e l'impatto sul mercato del lavoro. Guardando al futuro, esprime entusiasmo per il potenziale dell'IA nel risolvere problemi globali come il cambiamento climatico e nell'accelerare la ricerca medica, oltre ai progressi verso un'intelligenza artificiale più generale e versatile.
  `,
}

export default function TranscriptionDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{mockTranscription.title}</h1>
              <p className="text-sm text-gray-500">
                {formatDate(mockTranscription.date)} • {mockTranscription.duration} • {mockTranscription.fileSize}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copia
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Scarica .txt
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Scarica .pdf
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Trascrizione completa</h2>
                <div className="whitespace-pre-line text-sm text-gray-700 max-h-[600px] overflow-y-auto pr-4">
                  {mockTranscription.transcription}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Riassunto</h2>
                <div className="whitespace-pre-line text-sm text-gray-700">{mockTranscription.summary}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
