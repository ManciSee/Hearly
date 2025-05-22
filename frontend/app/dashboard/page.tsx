import type { Metadata } from "next"
import DashboardHeader from "@/components/dashboard-header"
import AudioUploader from "@/components/audio-uploader"
import FileList from "@/components/file-list"

export const metadata: Metadata = {
  title: "Dashboard | AudioScript",
  description: "Gestisci le tue trascrizioni audio",
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
          <AudioUploader />
          <FileList />
        </div>
      </main>
    </div>
  )
}
