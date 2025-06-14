"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardHeader from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  FileAudio,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { config } from "@/lib/config";

// Mapping delle lingue per visualizzazione
const languageNames: { [key: string]: string } = {
  it: "Italiano",
  en: "Inglese",
  es: "Spagnolo",
  fr: "Francese",
  de: "Tedesco",
  pt: "Portoghese",
  ru: "Russo",
  zh: "Cinese",
  ja: "Giapponese",
  ar: "Arabo",
};

interface LanguageDistribution {
  username: string;
  total_transcriptions: number;
  languages: { [key: string]: number };
  message?: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [languageData, setLanguageData] = useState<LanguageDistribution | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguageDistribution = async () => {
      try {
        const authTokens = localStorage.getItem("auth_tokens");
        let token = null;

        if (!authTokens) {
          router.push("/login");
          return;
        }

        const parsedTokens = JSON.parse(authTokens);
        token = parsedTokens.access_token;

        // Decodifica il JWT per ottenere lo username
        const decoded = jwtDecode<any>(token);
        const currentUsername = decoded.username;

        const response = await axios.get(
          `${config.apiUrl}/users/${currentUsername}/language-distribution`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLanguageData(response.data);
        setError(null);
      } catch (err) {
        console.error("Errore nel recupero delle statistiche:", err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/login");
        } else {
          setError("Impossibile caricare le statistiche delle lingue");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLanguageDistribution();
  }, [router]);

  const getLanguageName = (code: string): string => {
    return languageNames[code] || code.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Le tue statistiche</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Audio trascritti (totale)
              </CardTitle>
              <FileAudio className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {languageData?.total_transcriptions || 0}
                </div>
              )}
              <p className="text-xs text-gray-500">Trascrizioni completate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Minuti trascritti (stima)
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">187</div>
              <p className="text-xs text-gray-500">Circa 3 ore e 7 minuti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lingue rilevate
              </CardTitle>
              <BarChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold">
                  {languageData?.languages
                    ? Object.keys(languageData.languages).length
                    : 0}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Lingue diverse identificate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ultimo utilizzo
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Oggi</div>
              <p className="text-xs text-gray-500">2 ore fa</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attività recente</CardTitle>
              <CardDescription>
                La tua attività degli ultimi 30 giorni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-md">
                <p className="text-gray-500">Grafico attività recente</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per lingua</CardTitle>
              <CardDescription>
                Lingue dei tuoi file audio trascritti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : languageData?.languages &&
                Object.keys(languageData.languages).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(languageData.languages)
                    .sort(([, a], [, b]) => b - a) // Ordina per percentuale decrescente
                    .map(([langCode, percentage]) => (
                      <div key={langCode}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {getLanguageName(langCode)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {languageData?.message ||
                      "Nessuna trascrizione completata trovata."}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Carica e trascrivi alcuni file audio per vedere le
                    statistiche delle lingue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
