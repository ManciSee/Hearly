import { useState } from "react";
import { AudioUploader } from "./components/AudioUploader";
import { FileList } from "./components/FileList";
import { Auth } from "./pages/Auth";
import { VerifyAccountPage } from "./pages/VerifyAccountPage";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<"home" | "auth" | "verify">(
    "home"
  );
  const [registeredUsername, setRegisteredUsername] = useState<string | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userTokens, setUserTokens] = useState(null);

  // Controlla se l'utente è già loggato all'avvio
  useState(() => {
    const storedTokens = localStorage.getItem("auth_tokens");
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setUserTokens(tokens);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Errore nel parsing dei token:", e);
        localStorage.removeItem("auth_tokens");
      }
    }
  });

  const handleUploadSuccess = () => {
    // Aggiorna la lista dei file dopo un caricamento
    setRefreshKey((prev) => prev + 1);
  };

  const handleRegistrationSuccess = (username: string) => {
    setRegisteredUsername(username);
    setCurrentPage("verify");
  };

  const handleLoginSuccess = (tokens: any) => {
    setUserTokens(tokens);
    setIsLoggedIn(true);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_tokens");
    setUserTokens(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con sfondo colorato */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Hearly</h1>
              <p className="mt-2 text-blue-100">
                Audio transcription cloud platform
              </p>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <button
                    className={`text-white px-4 py-2 rounded-lg ${
                      currentPage === "home"
                        ? "bg-blue-700"
                        : "hover:bg-blue-700"
                    }`}
                    onClick={() => setCurrentPage("home")}
                  >
                    Home
                  </button>
                </li>
                {isLoggedIn ? (
                  <li>
                    <button
                      className="text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                ) : (
                  <li>
                    <button
                      className={`text-white px-4 py-2 rounded-lg ${
                        currentPage === "auth" || currentPage === "verify"
                          ? "bg-blue-700"
                          : "hover:bg-blue-700"
                      }`}
                      onClick={() => setCurrentPage("auth")}
                    >
                      Login / Sign Up
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        {currentPage === "home" ? (
          <div className="max-w-5xl mx-auto">
            {/* Sezione di caricamento con card */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Carica un file audio
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your audio files to get automatic transcriptions and
                summaries. We support MP3, WAV and M4A formats.
              </p>
              <AudioUploader onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Sezione dei file con card */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">I tuoi file</h2>
                <span className="text-sm text-gray-500">
                  Updated in real time
                </span>
              </div>
              <FileList key={refreshKey} />
            </div>
          </div>
        ) : currentPage === "auth" ? (
          <Auth
            onRegistrationSuccess={handleRegistrationSuccess}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <VerifyAccountPage initialUsername={registeredUsername} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-10 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Hearly - Audio transcription cloud platform</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
