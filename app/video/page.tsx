"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Video,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Subtitles,
  Users,
  FileText,
  Download,
  Check,
  Copy,
  Sparkles,
  Wand2,
  Mic,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Captions,
  Brain,
  Accessibility,
  Eye,
  Type,
  Palette,
  Move,
} from "lucide-react"

interface VideoData {
  full_transcript: string
  simplified_transcript: string
  captions: Array<{
    id: number
    start: number
    end: number
    text: string
    speaker?: string
    words?: Array<{
      text: string
      start: number
      end: number
      confidence: number
    }>
  }>
  vtt_content: string
  speaker_segments: Array<{
    speaker: string
    text: string
    start: number
    end: number
    confidence: number
  }>
  video_info: {
    duration: number
    has_audio: boolean
    fps?: number
    size?: [number, number]
  }
  word_count: number
  duration: number
  speaker_count: number
  accessibility_features?: {
    has_captions: boolean
    has_diarization: boolean
    has_word_timing: boolean
    caption_format: string
    simplified_available: boolean
  }
}

export default function VideoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [error, setError] = useState<string>("")

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [currentCaption, setCurrentCaption] = useState<string>("")
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("")
  const [showCaptions, setShowCaptions] = useState(true)
  const [showSimplified, setShowSimplified] = useState(false)

  const [captionSize, setCaptionSize] = useState<"small" | "medium" | "large" | "xlarge">("medium")
  const [captionPosition, setCaptionPosition] = useState<"bottom" | "top">("bottom")
  const [captionStyle, setCaptionStyle] = useState<"default" | "highContrast" | "yellow" | "outline">("default")
  const [showSettings, setShowSettings] = useState(false)

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (videoData?.captions && showCaptions) {
      const caption = videoData.captions.find(
        c => currentTime >= c.start && currentTime <= c.end
      )
      if (caption) {
        setCurrentCaption(caption.text)
        setCurrentSpeaker(caption.speaker || "")
      } else {
        setCurrentCaption("")
        setCurrentSpeaker("")
      }
    }
  }, [currentTime, videoData, showCaptions])

  useEffect(() => {
    if (isProcessing) {
      const stages = [
        { progress: 10, text: "Uploading video..." },
        { progress: 25, text: "Extracting audio track..." },
        { progress: 45, text: "Transcribing with AI..." },
        { progress: 65, text: "Detecting speakers..." },
        { progress: 80, text: "Generating captions..." },
        { progress: 95, text: "Finalizing..." },
      ]
      let currentStage = 0
      const interval = setInterval(() => {
        if (currentStage < stages.length) {
          setProcessingProgress(stages[currentStage].progress)
          setProcessingStage(stages[currentStage].text)
          currentStage++
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isProcessing])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file")
      return
    }

    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setError("")
    setIsProcessing(true)
    setProcessingProgress(0)
    setVideoData(null)

    try {
      const formData = new FormData()
      formData.append("video", file)

      const response = await fetch("http://localhost:8000/process/video", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.result) {
        setVideoData(data.result)
        setProcessingProgress(100)
        setProcessingStage("Complete!")
      } else {
        setError(data.error || "Video processing failed")
      }
    } catch (err) {
      setError("Failed to connect to server. Make sure the backend is running.")
      console.error("Video upload error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const downloadVTT = () => {
    if (!videoData?.vtt_content) return
    const blob = new Blob([videoData.vtt_content], { type: "text/vtt" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${videoFile?.name || "video"}_captions.vtt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const captionStyles = {
    default: "bg-black/80 text-white",
    highContrast: "bg-black text-yellow-300 border-2 border-yellow-300",
    yellow: "bg-yellow-400 text-black font-bold",
    outline: "bg-transparent text-white [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]"
  }

  const captionSizes = {
    small: "text-sm",
    medium: "text-lg",
    large: "text-2xl",
    xlarge: "text-4xl"
  }

  const resetVideo = () => {
    setVideoFile(null)
    setVideoUrl("")
    setVideoData(null)
    setError("")
    setCurrentTime(0)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/20">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl shadow-lg shadow-violet-500/25">
              <Video className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Video Accessibility Studio
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your videos with AI-powered real-time captions, speaker detection, and accessibility features.
            Designed for deaf and cognitive accessibility needs.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-violet-500/10 border-violet-500/30 text-violet-400">
              <Captions className="h-3 w-3 mr-1" /> Real-time Captions
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
              <Users className="h-3 w-3 mr-1" /> Speaker Detection
            </Badge>
            <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-400">
              <Brain className="h-3 w-3 mr-1" /> AI Transcription
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-400">
              <Accessibility className="h-3 w-3 mr-1" /> Accessibility First
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        {!videoUrl ? (
          /* Upload Section */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`max-w-4xl mx-auto transition-all duration-300 ${isDragging ? "scale-105" : ""}`}
          >
            <Card className={`border-2 border-dashed transition-all duration-300 ${
              isDragging 
                ? "border-violet-500 bg-violet-500/10 shadow-2xl shadow-violet-500/20" 
                : "border-border hover:border-violet-500/50 hover:shadow-xl"
            }`}>
              <CardContent className="py-16">
                <div className="text-center">
                  {/* Animated upload icon */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <div className="relative p-6 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-full border border-violet-500/30">
                      <Film className="h-16 w-16 text-violet-400" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {isDragging ? "Drop your video here!" : "Upload Your Video"}
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Drag and drop your video file here, or click to browse.
                    We'll automatically generate captions with speaker detection.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-lg shadow-violet-500/25 gap-2"
                  >
                    <Upload className="h-5 w-5" />
                    Choose Video File
                  </Button>

                  <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      MP4, WebM, MOV, AVI
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Up to 500MB
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Free Processing
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card className="bg-card/50 backdrop-blur border-violet-500/20">
                <CardContent className="pt-6">
                  <div className="p-2 bg-violet-500/10 rounded-lg w-fit mb-3">
                    <Subtitles className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Real-Time Captions</h3>
                  <p className="text-sm text-muted-foreground">
                    Word-level accurate captions that sync perfectly with your video
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-pink-500/20">
                <CardContent className="pt-6">
                  <div className="p-2 bg-pink-500/10 rounded-lg w-fit mb-3">
                    <Users className="h-5 w-5 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Speaker Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically identifies different speakers in your video
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="p-2 bg-orange-500/10 rounded-lg w-fit mb-3">
                    <Accessibility className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Accessibility Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Customizable caption styles, sizes, and positions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Video Player and Results */
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Processing State */}
            {isProcessing && (
              <Card className="bg-card/80 backdrop-blur border-violet-500/20">
                <CardContent className="py-8">
                  <div className="text-center max-w-md mx-auto">
                    <div className="relative inline-block mb-4">
                      <Loader2 className="h-12 w-12 text-violet-400 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {processingStage || "Processing your video..."}
                    </h3>
                    <Progress value={processingProgress} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {processingProgress}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-400">{error}</p>
                    <Button variant="outline" size="sm" onClick={resetVideo} className="ml-auto">
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Player */}
            <Card className="bg-black overflow-hidden border-0 shadow-2xl">
              <div className="relative group">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full aspect-video bg-black"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={togglePlay}
                />

                {/* Caption Overlay */}
                {showCaptions && currentCaption && (
                  <div
                    className={`absolute left-0 right-0 px-4 py-2 flex justify-center transition-all ${
                      captionPosition === "bottom" ? "bottom-20" : "top-4"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-[85%] text-center ${captionStyles[captionStyle]} ${captionSizes[captionSize]}`}
                    >
                      {currentSpeaker && (
                        <span className="text-violet-400 font-semibold mr-2">
                          [{currentSpeaker}]
                        </span>
                      )}
                      {currentCaption}
                    </div>
                  </div>
                )}

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => seekTo(Number(e.target.value))}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Skip Back */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(-10)}
                        className="text-white hover:bg-white/20 h-10 w-10"
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>

                      {/* Play/Pause */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20 h-12 w-12"
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>

                      {/* Skip Forward */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(10)}
                        className="text-white hover:bg-white/20 h-10 w-10"
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>

                      {/* Volume */}
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>

                      {/* Time */}
                      <span className="text-white text-sm ml-3">
                        {formatTime(currentTime)} / {formatTime(duration || videoData?.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Captions Toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCaptions(!showCaptions)}
                        className={`text-white hover:bg-white/20 ${showCaptions ? "bg-violet-500/30" : ""}`}
                      >
                        <Subtitles className="h-5 w-5" />
                      </Button>

                      {/* Settings */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`text-white hover:bg-white/20 ${showSettings ? "bg-violet-500/30" : ""}`}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Big Play Button Overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Caption Settings Panel */}
            {showSettings && (
              <Card className="bg-card/90 backdrop-blur border-violet-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-violet-400" />
                    Caption Settings
                  </CardTitle>
                  <CardDescription>
                    Customize how captions appear for your accessibility needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Size */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                        <Type className="h-4 w-4" /> Size
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {(["small", "medium", "large", "xlarge"] as const).map((size) => (
                          <Button
                            key={size}
                            variant={captionSize === size ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCaptionSize(size)}
                            className="text-xs"
                          >
                            {size === "small" ? "S" : size === "medium" ? "M" : size === "large" ? "L" : "XL"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                        <Move className="h-4 w-4" /> Position
                      </label>
                      <div className="flex gap-1">
                        <Button
                          variant={captionPosition === "bottom" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCaptionPosition("bottom")}
                          className="text-xs flex-1"
                        >
                          Bottom
                        </Button>
                        <Button
                          variant={captionPosition === "top" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCaptionPosition("top")}
                          className="text-xs flex-1"
                        >
                          Top
                        </Button>
                      </div>
                    </div>

                    {/* Style */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                        <Palette className="h-4 w-4" /> Style
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {(["default", "highContrast", "yellow", "outline"] as const).map((style) => (
                          <Button
                            key={style}
                            variant={captionStyle === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCaptionStyle(style)}
                            className="text-xs"
                          >
                            {style === "default" ? "Default" : style === "highContrast" ? "Hi-Con" : style === "yellow" ? "Yellow" : "Outline"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Text Mode */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                        <Brain className="h-4 w-4" /> Text Mode
                      </label>
                      <Button
                        variant={showSimplified ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSimplified(!showSimplified)}
                        className="w-full text-xs"
                      >
                        {showSimplified ? "✓ Simplified" : "Full Text"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Data Display */}
            {videoData && !isProcessing && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Video Info Card */}
                <Card className="bg-card/80 backdrop-blur border-violet-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Film className="h-4 w-4 text-violet-400" />
                      Video Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                        <div className="text-lg font-bold">{formatTime(videoData.duration)}</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <Users className="h-4 w-4 text-muted-foreground mb-1" />
                        <div className="text-lg font-bold">{videoData.speaker_count}</div>
                        <div className="text-xs text-muted-foreground">Speakers</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground mb-1" />
                        <div className="text-lg font-bold">{videoData.word_count.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <Subtitles className="h-4 w-4 text-muted-foreground mb-1" />
                        <div className="text-lg font-bold">{videoData.captions.length}</div>
                        <div className="text-xs text-muted-foreground">Captions</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadVTT}
                      className="w-full gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Captions (.vtt)
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetVideo}
                      className="w-full text-muted-foreground"
                    >
                      Upload New Video
                    </Button>
                  </CardContent>
                </Card>

                {/* Transcript Card */}
                <Card className="md:col-span-2 bg-card/80 backdrop-blur border-violet-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-400" />
                        {showSimplified ? "Simplified Transcript" : "Full Transcript"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(
                          showSimplified ? videoData.simplified_transcript : videoData.full_transcript,
                          "transcript"
                        )}
                      >
                        {copiedField === "transcript" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto p-4 bg-secondary/30 rounded-lg">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                        {showSimplified ? videoData.simplified_transcript : videoData.full_transcript}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Speaker Timeline */}
                {videoData.speaker_segments && videoData.speaker_segments.length > 0 && (
                  <Card className="md:col-span-3 bg-card/80 backdrop-blur border-violet-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-violet-400" />
                        Speaker Timeline
                      </CardTitle>
                      <CardDescription>Click to jump to that point in the video</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {videoData.speaker_segments.map((segment, index) => (
                          <div
                            key={index}
                            onClick={() => seekTo(segment.start)}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              currentTime >= segment.start && currentTime <= segment.end
                                ? "bg-violet-500/20 border border-violet-500/30"
                                : "bg-secondary/30 hover:bg-secondary/50"
                            }`}
                          >
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${
                                segment.speaker === "A"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : segment.speaker === "B"
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : "bg-violet-500/10 text-violet-400 border-violet-500/30"
                              }`}
                            >
                              Speaker {segment.speaker}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground line-clamp-2">{segment.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(segment.start)} - {formatTime(segment.end)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
