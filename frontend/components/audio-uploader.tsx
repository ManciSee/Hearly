"use client";

import type React from "react";

import { useState, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";

type AudioUploaderProps = {
  onUploadSuccess?: () => void;
};

export default function AudioUploader({ onUploadSuccess }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("audio/")) {
        setFile(droppedFile);
      } else {
        setError("Per favore carica solo file audio");
      }
    }
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
      await axios.post(`${config.apiUrl}/upload/`, formData, {
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Carica file audio</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Trascina qui il tuo file audio o
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleziona file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                  id="audio-upload"
                />
              </div>
              <p className="text-xs text-gray-500">
                Supporta: MP3, WAV, M4A, OGG (max 100MB)
              </p>
            </div>
          ) : (
            <div className="text-green-600">
              <div className="rounded-full bg-green-100 p-3 mx-auto mb-2">
                <FileAudio className="h-6 w-6 text-green-600 mx-auto" />
              </div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <Button
          className="w-full mt-4"
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Caricamento in corso...
            </>
          ) : (
            "Carica file"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
