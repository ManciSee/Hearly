import { useState } from "react";
import { AudioUploader } from "./components/AudioUploader";
import { FileList } from "./components/FileList";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Aggiorna la lista dei file dopo un caricamento
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con sfondo colorato */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-4xl font-bold">Audio Cloud</h1>
          <p className="mt-2 text-blue-100">
            Piattaforma di trascrizione e analisi audio
          </p>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Sezione di caricamento con card */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Carica un file audio
            </h2>
            <p className="text-gray-600 mb-6">
              Carica i tuoi file audio per ottenere trascrizioni e riassunti
              automatici. Supportiamo formati MP3, WAV e M4A.
            </p>
            <AudioUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Sezione dei file con card */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">I tuoi file</h2>
              <span className="text-sm text-gray-500">
                Aggiornato in tempo reale
              </span>
            </div>
            <FileList key={refreshKey} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-10 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Audio Cloud - Piattaforma di elaborazione audio</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
