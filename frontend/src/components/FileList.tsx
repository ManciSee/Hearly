import { useEffect, useState } from "react";
import axios from "axios";

type AudioFile = {
  id: string;
  filename: string;
  url: string;
};

type TranscriptionStatus = {
  status: string;
  transcription?: string;
  message?: string;
};

export function FileList() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<
    Record<string, TranscriptionStatus>
  >({});
  const [summaries, setSummaries] = useState<{
    [key: string]: { summary: string; isLoading: boolean };
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);

        const authTokens = localStorage.getItem("auth_tokens");
        let token = null;

        if (authTokens) {
          token = JSON.parse(authTokens).access_token;
        }

        if (!token) {
          setError("Session expired, please log in again");
          setIsLoading(false);
          return;
        }

        const res = await axios.get("http://localhost:8000/files/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setFiles(res.data);
        setError(null);
      } catch (err) {
        console.error("Error retrieving files: ", err);
        setError("Unable to load file list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const startTranscription = async (id: string) => {
    try {
      setLoadingFiles((prev) => ({ ...prev, [id]: true }));

      // Obtain the token JWT from localStorage
      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        return;
      }

      await axios.post(
        `http://localhost:8000/transcribe/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTranscriptions((prev) => ({
        ...prev,
        [id]: { status: "QUEUED" },
      }));

      setSelectedId(id);

      pollTranscriptionStatus(id, token);
    } catch (err) {
      console.error("Errore nell'avvio della trascrizione:", err);
      setError("Impossibile avviare la trascrizione");
      setLoadingFiles((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Polling function to check the transcription status
  // and update the state accordingly
  const pollTranscriptionStatus = async (id: string, token: string) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/transcription/${id}?check_status=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setTranscriptions((prev) => ({
        ...prev,
        [id]: {
          status: data.status,
          transcription: data.transcription,
          message: data.message,
        },
      }));

      if (
        data.status !== "COMPLETED" &&
        data.status !== "ERROR" &&
        data.status !== "FAILED"
      ) {
        setTimeout(() => pollTranscriptionStatus(id, token), 5000);
      } else {
        setLoadingFiles((prev) => ({ ...prev, [id]: false }));
      }
    } catch (err) {
      console.error("Error retrieving transcription status: ", err);
      setLoadingFiles((prev) => ({ ...prev, [id]: false }));
      setTranscriptions((prev) => ({
        ...prev,
        [id]: {
          status: "ERROR",
          message: "Error retrieving status",
        },
      }));
    }
  };

  const toggleTranscription = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else if (transcriptions[id]?.transcription) {
      setSelectedId(id);
    } else {
      startTranscription(id);
    }
  };

  const getSummary = async (id: string) => {
    try {
      // Se il riassunto è già stato caricato, non è necessario ricaricarlo
      if (summaries[id] && !summaries[id].isLoading) {
        return;
      }

      // Impostiamo lo stato di caricamento
      setSummaries((prev) => ({
        ...prev,
        [id]: { summary: "", isLoading: true },
      }));

      // Otteniamo il token JWT dal localStorage
      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        return;
      }

      // Otteniamo il riassunto
      const response = await axios.get(
        `http://localhost:8000/summarize/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Aggiorniamo lo stato
      setSummaries((prev) => ({
        ...prev,
        [id]: { summary: response.data.summary, isLoading: false },
      }));

      // Assicuriamoci che la trascrizione sia visibile
      setSelectedId(id);
    } catch (err) {
      console.error("Errore nell'ottenere il riassunto:", err);
      setSummaries((prev) => ({
        ...prev,
        [id]: {
          summary: "Errore nel generare il riassunto.",
          isLoading: false,
        },
      }));
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-500">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Audio files uploaded</h2>
      {files.length === 0 ? (
        <p className="text-gray-500">No files found.</p>
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
                <div className="flex ml-4">
                  <button
                    onClick={() => toggleTranscription(file.id)}
                    disabled={loadingFiles[file.id]}
                    className={`px-4 py-2 rounded-lg transition mr-2 ${
                      loadingFiles[file.id]
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : selectedId === file.id
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {loadingFiles[file.id]
                      ? "Processing..."
                      : selectedId === file.id
                      ? "Hide"
                      : transcriptions[file.id]?.transcription
                      ? "Show transcript"
                      : "Transcribe"}
                  </button>

                  {/* Pulsante di riassunto - visibile solo se la trascrizione è disponibile */}
                  {transcriptions[file.id]?.status === "COMPLETED" && (
                    <button
                      onClick={() => getSummary(file.id)}
                      disabled={summaries[file.id]?.isLoading}
                      className={`px-4 py-2 rounded-lg transition ${
                        summaries[file.id]?.isLoading
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {summaries[file.id]?.isLoading
                        ? "Generating..."
                        : "Summarize"}
                    </button>
                  )}
                </div>
              </div>

              {selectedId === file.id && (
                <div className="mt-4">
                  <div className="p-3 bg-gray-50 border rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                    <strong>Transcription: </strong>

                    {transcriptions[file.id]?.status === "COMPLETED" ? (
                      <p className="mt-2">
                        {transcriptions[file.id]?.transcription}
                      </p>
                    ) : transcriptions[file.id]?.status === "ERROR" ||
                      transcriptions[file.id]?.status === "FAILED" ? (
                      <p className="mt-2 text-red-600">
                        Error during transcription. Retry!
                      </p>
                    ) : (
                      <div className="mt-2">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent mr-2"></div>
                        <span>
                          Transcription in progress...
                          {transcriptions[file.id]?.message && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({transcriptions[file.id]?.message})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mostriamo il riassunto se disponibile */}
                  {summaries[file.id]?.summary && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                      <strong>Summary: </strong>

                      {summaries[file.id]?.isLoading ? (
                        <div className="mt-2">
                          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-r-transparent mr-2"></div>
                          <span>Generating summary...</span>
                        </div>
                      ) : (
                        <p className="mt-2">{summaries[file.id]?.summary}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
