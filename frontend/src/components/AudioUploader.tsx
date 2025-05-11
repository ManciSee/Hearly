import { useState, useRef } from "react";
import axios from "axios";

type AudioUploaderProps = {
  onUploadSuccess?: () => void;
};

export function AudioUploader({ onUploadSuccess }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Seleziona un file audio per continuare");
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setError("Per favore carica solo file audio");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Ottieni il token JWT dal localStorage
      const authTokens = localStorage.getItem("auth_tokens");
      let token = null;

      if (authTokens) {
        token = JSON.parse(authTokens).access_token;
      }

      if (!token) {
        setError("Sessione scaduta, effettua nuovamente il login");
        setIsUploading(false);
        return;
      }

      // Includi il token nell'header Authorization
      await axios.post("http://localhost:8000/upload/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFile(null);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Errore upload:", err);
      setError("Si è verificato un errore durante il caricamento");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="audio/*"
          id="audio-upload"
        />
        <label htmlFor="audio-upload" className="cursor-pointer block">
          {file ? (
            <div className="text-green-600">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium">Clicca per selezionare un file</p>
              <p className="text-xs mt-1">o trascina qui il tuo file audio</p>
            </div>
          )}
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`w-full rounded-lg py-3 px-4 font-medium transition-colors ${
          isUploading || !file
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isUploading ? "Caricamento in corso..." : "Carica file"}
      </button>
    </div>
  );
}
