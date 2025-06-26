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

interface TotalDuration {
  total_duration_seconds: number;
  total_duration_formatted: string;
  audio_files_count: number;
  latest_transcription_date: string | null;
  latest_transcription_timestamp: number | null;
}

interface ActivityData {
  date: string;
  day: string;
  uploads: number;
}

interface RecentActivity {
  username: string;
  period_days: number;
  activity_data: ActivityData[];
  total_uploads: number;
  active_days: number;
  message?: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [languageData, setLanguageData] = useState<LanguageDistribution | null>(
    null
  );
  const [durationData, setDurationData] = useState<TotalDuration | null>(null);
  const [activityData, setActivityData] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDuration, setLoadingDuration] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const authTokens = localStorage.getItem("auth_tokens");
        if (!authTokens) {
          router.push("/login");
          return;
        }

        const parsedTokens = JSON.parse(authTokens);
        const token = parsedTokens.access_token;

        const decoded = jwtDecode<any>(token);
        const currentUsername = decoded.username;

        setUsername(currentUsername);

        // Fetch language distribution
        const fetchLanguageData = async () => {
          try {
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
            console.error(
              "Errore nel recupero delle statistiche delle lingue:",
              err
            );
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              router.push("/login");
            } else {
              setError("Impossibile caricare le statistiche delle lingue");
            }
          } finally {
            setLoading(false);
          }
        };

        // Fetch total duration
        const fetchDurationData = async () => {
          try {
            const response = await axios.get(
              `${config.apiUrl}/users/${currentUsername}/total-duration`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const {
              total_seconds,
              total_formatted,
              audio_files_count,
              latest_transcription_date,
              latest_transcription_timestamp,
            } = response.data;

            setDurationData({
              total_duration_seconds: total_seconds,
              total_duration_formatted: total_formatted,
              audio_files_count,
              latest_transcription_date,
              latest_transcription_timestamp,
            });
            setDurationError(null);
          } catch (err) {
            console.error("Errore nel recupero della durata totale:", err);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              router.push("/login");
            } else {
              setDurationError("Impossibile caricare la durata totale");
            }
          } finally {
            setLoadingDuration(false);
          }
        };

        // Fetch recent activity
        const fetchActivityData = async () => {
          try {
            const response = await axios.get(
              `${config.apiUrl}/users/${currentUsername}/recent-activity`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            setActivityData(response.data);
            setActivityError(null);
          } catch (err) {
            console.error("Errore nel recupero dell'attività recente:", err);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              router.push("/login");
            } else {
              setActivityError("Impossibile caricare l'attività recente");
            }
          } finally {
            setLoadingActivity(false);
          }
        };

        // Esegui tutte le chiamate in parallelo
        await Promise.all([
          fetchLanguageData(),
          fetchDurationData(),
          fetchActivityData(),
        ]);
      } catch (err) {
        console.error("Errore generale:", err);
        setLoading(false);
        setLoadingDuration(false);
        setLoadingActivity(false);
      }
    };

    fetchStatistics();
  }, [router]);

  const getLanguageName = (code: string): string => {
    return languageNames[code] || code.toUpperCase();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatLastActivity = (
    dateString: string | null
  ): { display: string; subtitle: string } => {
    if (!dateString) {
      return { display: "Mai", subtitle: "Nessuna trascrizione" };
    }

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let display: string;
    let subtitle: string;

    if (diffHours < 24) {
      if (diffHours < 1) {
        display = "Poco fa";
        subtitle = "Meno di un'ora fa";
      } else if (diffHours === 1) {
        display = "Oggi";
        subtitle = "1 ora fa";
      } else {
        display = "Oggi";
        subtitle = `${diffHours} ore fa`;
      }
    } else if (diffDays === 1) {
      display = "Ieri";
      subtitle = date.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays < 7) {
      display = `${diffDays} giorni fa`;
      subtitle = date.toLocaleDateString("it-IT", { weekday: "long" });
    } else {
      display = date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
      });
      subtitle = date.toLocaleDateString("it-IT", { weekday: "long" });
    }

    return { display, subtitle };
  };

  // Funzione per filtrare solo i giorni con attività
  const getActiveDays = (activityData: RecentActivity) => {
    return activityData.activity_data.filter((day) => day.uploads > 0);
  };

  const lastActivity = formatLastActivity(
    durationData?.latest_transcription_date || null
  );

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
                Durata totale trascrizioni
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loadingDuration ? (
                <Skeleton className="h-8 w-20" />
              ) : durationError ? (
                <div className="text-2xl font-bold text-red-500">--</div>
              ) : (
                <div className="text-2xl font-bold">
                  {durationData?.total_duration_seconds
                    ? formatDuration(durationData.total_duration_seconds)
                    : "0m"}
                </div>
              )}
              <p className="text-xs text-gray-500">
                {loadingDuration ? (
                  <Skeleton className="h-3 w-24" />
                ) : durationError ? (
                  <span className="text-red-500">Errore nel caricamento</span>
                ) : durationData?.total_duration_formatted ? (
                  durationData.total_duration_formatted
                ) : (
                  "Nessuna trascrizione"
                )}
              </p>
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
              {loadingDuration ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {lastActivity.display}
                  </div>
                  <p className="text-xs text-gray-500">
                    {lastActivity.subtitle}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attività recente</CardTitle>
              <CardDescription>
                I tuoi upload degli ultimi 30 giorni
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{activityError}</AlertDescription>
                </Alert>
              )}

              {loadingActivity ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-[260px] w-full" />
                  </div>
                </div>
              ) : activityData?.activity_data ? (
                <div className="space-y-4">
                  {/* Statistiche rapide */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-600">
                        {activityData.total_uploads} upload totali
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">
                        {activityData.active_days} giorni attivi
                      </span>
                    </div>
                  </div>

                  {/* Grafico a barre - solo giorni con attività */}
                  {(() => {
                    const activeDays = getActiveDays(activityData);

                    if (activeDays.length === 0) {
                      return (
                        <div className="h-[240px] flex items-center justify-center bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                              Nessuna attività negli ultimi 30 giorni
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                              Carica alcuni file audio per vedere il grafico
                              dell'attività.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const maxUploads = Math.max(
                      ...activeDays.map((d) => d.uploads)
                    );

                    return (
                      <div className="space-y-4">
                        <div className="h-[240px] p-4 bg-gray-50 rounded-lg overflow-x-auto">
                          <div className="flex items-end gap-3 h-full min-w-fit">
                            {activeDays.map((day, index) => {
                              const height =
                                maxUploads > 0
                                  ? (day.uploads / maxUploads) * 180
                                  : 0;

                              return (
                                <div
                                  key={day.date}
                                  className="flex flex-col items-center group"
                                >
                                  {/* Barra */}
                                  <div className="flex items-end h-[180px] mb-3">
                                    <div
                                      className="bg-blue-600 rounded-t-sm transition-all duration-200 group-hover:bg-blue-700 min-h-[4px] w-8"
                                      style={{
                                        height: `${Math.max(height, 4)}px`,
                                      }}
                                      title={`${day.day}: ${
                                        day.uploads
                                      } upload${day.uploads !== 1 ? "s" : ""}`}
                                    ></div>
                                  </div>

                                  {/* Etichetta data */}
                                  <div className="text-center">
                                    <span className="text-xs text-gray-600 font-medium block">
                                      {day.day}
                                    </span>
                                    <span className="text-xs text-blue-600 font-bold">
                                      {day.uploads}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Legenda migliorata */}
                        <div className="text-xs text-gray-500 text-center space-y-1">
                          <p>Mostrati solo i giorni con attività</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Nessuna attività negli ultimi 30 giorni
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Carica alcuni file audio per vedere il grafico
                      dell'attività.
                    </p>
                  </div>
                </div>
              )}
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
