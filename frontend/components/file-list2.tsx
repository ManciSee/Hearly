"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Download, FileText } from "lucide-react";
import { config } from "@/lib/config";

type AudioFile = {
  id: string;
  filename: string;
  url: string;
  status?: string; // Aggiungo l'attributo status
};

type TranscriptionStatus = {
  status: string;
  transcription?: string;
  message?: string;
};

export default function FileList() {
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

  const fetchFiles = async () => {
    try {
      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        setIsLoading(false);
        return;
      }

      const res = await axios.get(`${config.apiUrl}/files/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFiles(res.data);

      // Inizializza lo stato delle trascrizioni per i file già trascritti
      const initialTranscriptions: Record<string, TranscriptionStatus> = {};
      res.data.forEach((file: AudioFile) => {
        if (file.status && file.status !== "PENDING") {
          initialTranscriptions[file.id] = { status: file.status };
        }
      });

      setTranscriptions((prev) => ({ ...prev, ...initialTranscriptions }));
      setError(null);
    } catch (err) {
      setError("Impossibile caricare la lista dei file");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const startTranscription = async (id: string) => {
    try {
      setLoadingFiles((prev) => ({ ...prev, [id]: true }));

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
        `${config.apiUrl}/transcribe/${id}`,
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
      setError("Impossibile avviare la trascrizione");
      setLoadingFiles((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pollTranscriptionStatus = async (id: string, token: string) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/transcription/${id}?check_status=true`,
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
        // Aggiorna lo stato del file nella lista
        setFiles((prev) =>
          prev.map((file) =>
            file.id === id ? { ...file, status: data.status } : file
          )
        );
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

  const fetchTranscription = async (id: string) => {
    try {
      setLoadingFiles((prev) => ({ ...prev, [id]: true }));

      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        return;
      }

      const response = await axios.get(`${config.apiUrl}/transcription/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTranscriptions((prev) => ({
        ...prev,
        [id]: {
          status: "COMPLETED",
          transcription: response.data.transcription,
        },
      }));

      setSelectedId(id);
    } catch (err) {
      setError("Impossibile recuperare la trascrizione");
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleTranscription = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      const file = files.find((f) => f.id === id);
      const fileStatus = file?.status || "PENDING";
      const transcriptionData = transcriptions[id];
      const hasTranscriptionText = transcriptionData?.transcription;

      if (fileStatus === "PENDING" && !transcriptionData) {
        // Se il file è in stato PENDING e non ha una trascrizione, avvia la trascrizione
        startTranscription(id);
      } else if (
        transcriptionData?.status === "COMPLETED" &&
        hasTranscriptionText
      ) {
        // Se la trascrizione è già completata E abbiamo il testo in memoria, mostra/nascondi
        setSelectedId(id);
      } else if (fileStatus !== "PENDING") {
        // Se il file è stato trascritto ma non abbiamo la trascrizione in memoria, recuperala da S3
        fetchTranscription(id);
      }
    }
  };

  const getSummary = async (id: string) => {
    try {
      if (summaries[id] && !summaries[id].isLoading) {
        return;
      }

      setSummaries((prev) => ({
        ...prev,
        [id]: { summary: "", isLoading: true },
      }));

      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        return;
      }

      const response = await axios.get(`${config.apiUrl}/summarize/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSummaries((prev) => ({
        ...prev,
        [id]: { summary: response.data.summary, isLoading: false },
      }));

      setSelectedId(id);
    } catch (err) {
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
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Caricamento file in corso...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Storico trascrizioni</CardTitle>
        <CardDescription>
          Gestisci le tue trascrizioni precedenti
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center text-red-600 py-4 mb-4">{error}</div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Non hai ancora trascrizioni. Carica un file audio per iniziare.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => {
              const fileStatus = file.status || "PENDING";
              const isTranscribed =
                fileStatus !== "PENDING" ||
                transcriptions[file.id]?.status === "COMPLETED";
              const isProcessing =
                loadingFiles[file.id] ||
                transcriptions[file.id]?.status === "QUEUED";

              return (
                <div key={file.id} className="border rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-700">
                        {file.filename}
                      </h3>
                      <div className="flex items-center gap-2">
                        <audio
                          controls
                          src={file.url}
                          className="mt-2 w-full"
                        />
                        {fileStatus !== "PENDING" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Trascritto
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fileStatus === "PENDING" && !isProcessing ? (
                        // Mostra solo il bottone "Trascrivi" se lo stato è PENDING
                        <Button
                          onClick={() => toggleTranscription(file.id)}
                          disabled={isProcessing}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Trascrivi
                        </Button>
                      ) : (
                        // Altrimenti mostra i bottoni per visualizzare/nascondere la trascrizione
                        <Button
                          onClick={() => toggleTranscription(file.id)}
                          disabled={isProcessing}
                          variant={
                            selectedId === file.id ? "destructive" : "default"
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Elaborazione...
                            </>
                          ) : selectedId === file.id ? (
                            "Nascondi"
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Mostra trascrizione
                            </>
                          )}
                        </Button>
                      )}

                      {/* Mostra il bottone per il riassunto solo se il file è stato trascritto */}
                      {isTranscribed && (
                        <Button
                          onClick={() => getSummary(file.id)}
                          disabled={summaries[file.id]?.isLoading}
                          variant="outline"
                        >
                          {summaries[file.id]?.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generazione...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Riassumi
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedId === file.id && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-gray-50 border rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                        <h4 className="font-semibold mb-2">Trascrizione:</h4>

                        {transcriptions[file.id]?.status === "COMPLETED" ? (
                          <p>{transcriptions[file.id]?.transcription}</p>
                        ) : transcriptions[file.id]?.status === "ERROR" ||
                          transcriptions[file.id]?.status === "FAILED" ? (
                          <p className="text-red-600">
                            Errore durante la trascrizione. Riprova!
                          </p>
                        ) : (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>
                              Trascrizione in corso...
                              {transcriptions[file.id]?.message && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({transcriptions[file.id]?.message})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {summaries[file.id]?.summary && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                          <h4 className="font-semibold mb-2">Riassunto:</h4>

                          {summaries[file.id]?.isLoading ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Generazione riassunto in corso...</span>
                            </div>
                          ) : (
                            <p>{summaries[file.id]?.summary}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
