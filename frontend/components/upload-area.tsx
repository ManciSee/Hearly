"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileAudio, Loader2 } from "lucide-react"

export default function UploadArea() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (isAudioFile(droppedFile)) {
        setFile(droppedFile)
        if (!title) {
          setTitle(droppedFile.name.split(".").slice(0, -1).join("."))
        }
      } else {
        alert("Per favore carica solo file audio (.mp3, .wav, .m4a, .ogg)")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (isAudioFile(selectedFile)) {
        setFile(selectedFile)
        if (!title) {
          setTitle(selectedFile.name.split(".").slice(0, -1).join("."))
        }
      } else {
        alert("Per favore carica solo file audio (.mp3, .wav, .m4a, .ogg)")
      }
    }
  }

  const isAudioFile = (file: File) => {
    const acceptedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg"]
    return acceptedTypes.includes(file.type)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const simulateUpload = () => {
    setIsUploading(true)
    let currentProgress = 0

    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setIsUploading(false)
        simulateTranscription()
      }
    }, 200)
  }

  const handleTranscribe = () => {
    if (!file) {
      alert("Per favore seleziona un file audio da trascrivere")
      return
    }

    if (!title.trim()) {
      alert("Per favore inserisci un titolo per la trascrizione")
      return
    }

    simulateUpload()
  }

  const simulateTranscription = () => {
    setIsTranscribing(true)

    setTimeout(() => {
      setIsTranscribing(false)
      // Instead of redirecting, we'll just show a success message
      alert("Trascrizione completata con successo!")
      handleRemoveFile()
      setTitle("")
    }, 3000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Carica file audio</CardTitle>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Trascina qui il tuo file audio o</p>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Seleziona file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-gray-500">Supporta: MP3, WAV, M4A, OGG (max 100MB)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileAudio className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isUploading || isTranscribing}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci un titolo per la trascrizione"
                disabled={isUploading || isTranscribing}
              />
            </div>

            {(isUploading || isTranscribing) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{isUploading ? "Caricamento in corso..." : "Trascrizione in corso..."}</span>
                  {isUploading && <span>{progress}%</span>}
                </div>
                {isUploading && <Progress value={progress} className="h-2" />}
              </div>
            )}

            <Button className="w-full" onClick={handleTranscribe} disabled={isUploading || isTranscribing}>
              {isUploading || isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Caricamento..." : "Trascrizione..."}
                </>
              ) : (
                "Trascrivi"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
