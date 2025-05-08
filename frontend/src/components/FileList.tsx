import { useEffect, useState } from "react";
import axios from "axios";

type AudioFile = {
  id: string;
  filename: string;
  url: string;
};

export function FileList() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("http://localhost:8000/files/");
        setFiles(res.data);
        setError(null);
      } catch (err) {
        console.error("Errore nel recupero dei file:", err);
        setError("Impossibile caricare la lista dei file");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const showTranscription = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.get(`http://localhost:8000/transcription/${id}`);
      setSelectedId(id);
      setTranscription(res.data.transcription);
      setError(null);
    } catch (err) {
      console.error("Errore nel recupero della trascrizione:", err);
      setError("Impossibile caricare la trascrizione");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-500">Caricamento file in corso...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">File audio caricati</h2>
      {files.length === 0 ? (
        <p className="text-gray-500">Nessun file trovato.</p>
      ) : (
        <ul className="space-y-4">
          {files.map((file) => (
            <li
              key={file.id}
              className="border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-700">{file.filename}</p>
                  <audio controls src={file.url} className="mt-2 w-full" />
                </div>
                <button
                  onClick={() => showTranscription(file.id)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {selectedId === file.id ? "Nascondi" : "Trascrivi"}
                </button>
              </div>
              {selectedId === file.id && (
                <div className="mt-4 p-3 bg-gray-50 border rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                  <strong>Trascrizione:</strong>
                  <p className="mt-2">{transcription}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
