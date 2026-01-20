"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ImageIcon, Mic, FileIcon, Upload, X, Loader2 } from "lucide-react"

export function UploadForm() {
  const router = useRouter()
  const [textInput, setTextInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Clear old file data and results when component mounts (fresh upload session)
  useEffect(() => {
    // Clear old file data from previous sessions
    sessionStorage.removeItem("udl-image-file")
    sessionStorage.removeItem("udl-audio-file")
    sessionStorage.removeItem("udl-pdf-file")
    sessionStorage.removeItem("udl-text-content")
    sessionStorage.removeItem("udl-results")
  }, [])

  // Auto-save draft functionality for cognitive accessibility
  useEffect(() => {
    const timer = setInterval(() => {
      if (textInput.trim()) {
        sessionStorage.setItem("udl-draft", textInput)
      }
    }, 5000) // Auto-save every 5 seconds
    
    return () => clearInterval(timer)
  }, [textInput])

  // Load draft on mount
  useEffect(() => {
    const draft = sessionStorage.getItem("udl-draft")
    if (draft && !textInput) {
      setTextInput(draft)
    }
  }, [])

  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setIsProcessing(true)

    // Clear ALL previous file data before storing new ones
    sessionStorage.removeItem("udl-image-file")
    sessionStorage.removeItem("udl-audio-file")
    sessionStorage.removeItem("udl-pdf-file")
    sessionStorage.removeItem("udl-results") // Clear old results too

    // Store form data for processing page
    const formData = {
      text: textInput,
      hasImage: !!imageFile,
      hasAudio: !!audioFile,
      hasPdf: !!pdfFile,
      imageName: imageFile?.name,
      audioName: audioFile?.name,
      pdfName: pdfFile?.name,
    }

    sessionStorage.setItem("udl-upload-data", JSON.stringify(formData))

    // Store text content separately for processing
    sessionStorage.setItem("udl-text-content", textInput)

    // Store files differently based on size to avoid QuotaExceededError
    // Small files (< 1MB): Store as base64 in sessionStorage
    // Large files: Store metadata only, will upload directly from FormData
    
    if (imageFile) {
      if (imageFile.size < 1024 * 1024) { // < 1MB
        const imageBase64 = await fileToBase64(imageFile)
        sessionStorage.setItem(
          "udl-image-file",
          JSON.stringify({ name: imageFile.name, data: imageBase64, type: imageFile.type }),
        )
      } else {
        // Store metadata only for large images
        sessionStorage.setItem(
          "udl-image-file",
          JSON.stringify({ name: imageFile.name, type: imageFile.type, size: imageFile.size, isLarge: true }),
        )
      }
    }
    
    if (audioFile) {
      // Audio files are typically large, store metadata only
      sessionStorage.setItem(
        "udl-audio-file",
        JSON.stringify({ name: audioFile.name, type: audioFile.type, size: audioFile.size, isLarge: true }),
      )
    }
    
    if (pdfFile) {
      if (pdfFile.size < 1024 * 1024) { // < 1MB
        const pdfBase64 = await fileToBase64(pdfFile)
        sessionStorage.setItem(
          "udl-pdf-file",
          JSON.stringify({ name: pdfFile.name, data: pdfBase64, type: pdfFile.type }),
        )
      } else {
        // Store metadata only for large PDFs
        sessionStorage.setItem(
          "udl-pdf-file",
          JSON.stringify({ name: pdfFile.name, type: pdfFile.type, size: pdfFile.size, isLarge: true }),
        )
      }
    }

    // Store actual files in window object for processing page to access
    // This persists across navigation within the same session
    if (typeof window !== 'undefined') {
      (window as any).__udl_files = {
        image: imageFile,
        audio: audioFile,
        pdf: pdfFile,
      }
    }

    router.push("/processing")
  }

  const hasContent = textInput.trim() || imageFile || audioFile || pdfFile

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Select Input Type</CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload text, images, audio, or PDF documents for accessibility transformation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6" role="tablist">
            <TabsTrigger 
              value="text" 
              className="gap-2"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') e.currentTarget.nextElementSibling?.focus()
                if (e.key === 'ArrowLeft') e.currentTarget.previousElementSibling?.focus()
              }}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger 
              value="image" 
              className="gap-2"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') e.currentTarget.nextElementSibling?.focus()
                if (e.key === 'ArrowLeft') e.currentTarget.previousElementSibling?.focus()
              }}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger 
              value="audio" 
              className="gap-2"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') e.currentTarget.nextElementSibling?.focus()
                if (e.key === 'ArrowLeft') e.currentTarget.previousElementSibling?.focus()
              }}
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pdf" 
              className="gap-2"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') e.currentTarget.nextElementSibling?.focus()
                if (e.key === 'ArrowLeft') e.currentTarget.previousElementSibling?.focus()
              }}
            >
              <FileIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">PDF</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div>
              <label htmlFor="text-input" className="text-sm font-medium text-foreground mb-2 block">
                Enter your text content
              </label>
              <Textarea
                id="text-input"
                placeholder="Paste or type your content here. The AI will simplify, translate, and analyze it for accessibility..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                aria-describedby="text-help"
              />
              <p id="text-help" className="text-xs text-muted-foreground mt-2">
                Supported: Plain text, paragraphs, articles, or documents
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <FileUploadZone
              accept="image/*"
              file={imageFile}
              onFileSelect={setImageFile}
              inputRef={imageInputRef}
              icon={ImageIcon}
              title="Upload Image"
              description="Drop an image here or click to browse"
              supportedFormats="PNG, JPG, JPEG, GIF, WebP"
            />
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <FileUploadZone
              accept="audio/*"
              file={audioFile}
              onFileSelect={setAudioFile}
              inputRef={audioInputRef}
              icon={Mic}
              title="Upload Audio"
              description="Drop an audio file here or click to browse"
              supportedFormats="MP3, WAV, M4A, OGG"
            />
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <FileUploadZone
              accept=".pdf"
              file={pdfFile}
              onFileSelect={setPdfFile}
              inputRef={pdfInputRef}
              icon={FileIcon}
              title="Upload PDF"
              description="Drop a PDF document here or click to browse"
              supportedFormats="PDF documents only"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t border-border">
          <Button size="lg" className="w-full gap-2" disabled={!hasContent || isProcessing} onClick={handleSubmit}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Process Content
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

interface FileUploadZoneProps {
  accept: string
  file: File | null
  onFileSelect: (file: File | null) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  supportedFormats: string
}

function FileUploadZone({
  accept,
  file,
  onFileSelect,
  inputRef,
  icon: Icon,
  title,
  description,
  supportedFormats,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      onFileSelect(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  if (file) {
    return (
      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onFileSelect(null)} aria-label={`Remove ${file.name}`}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          inputRef.current?.click()
        }
      }}
      aria-label={title}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
      />
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <p className="text-xs text-muted-foreground">Supported: {supportedFormats}</p>
    </div>
  )
}
