"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Languages,
  ImageIcon,
  Mic,
  BarChart,
  Shield,
  CheckCircle,
  Hand,
  AlertTriangle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  HelpCircle,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Pause,
  Square,
  Video,
  Play,
  SkipBack,
  SkipForward,
  Settings,
  Subtitles,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CognitiveLoadIndicator, ExportAccessibleFormats } from "@/components/accessibility-panel"

interface Results {
  extraction?: {
    text: string
    method: string
    note?: string
  }
  simplification?: {
    original: string
    simplified: string
  }
  translation?: {
    original: string
    translations: Record<string, {
      text: string
      native_name: string
      language_code: string
      audio?: string
    }>
    model?: string
    audio_enabled?: boolean
  }
  similarity?: {
    score: number
    interpretation: string
  }
  bias?: {
    success?: boolean
    overall_bias_detected: boolean
    bias_score: number
    flags: Array<{
      type: string
      matched_text?: string
      text?: string
      severity: string
      confidence?: number
      entities?: string[]
    }>
    suggestions?: Array<{
      original: string
      suggested: string
      type: string
    }>
    categories: string[]
    detailed_report: string
  }
  wcag?: {
    success: boolean
    overall_score: number
    wcag_level: string
    compliance_by_level: {
      A: number
      AA: number
      AAA: number
    }
    principle_scores: {
      perceivable: number
      operable: number
      understandable: number
      robust: number
    }
    checks: Array<{
      criterion: string
      name: string
      principle: string
      level: string
      passed: boolean
      message: string
      severity?: string
      impact?: string
      recommendation?: string
      details?: any
    }>
    issues: Array<{
      criterion: string
      name: string
      principle: string
      level: string
      severity: string
      issue: string
      impact: string
    }>
    recommendations: Array<{
      criterion: string
      action: string
      priority: string
    }>
    detailed_report: string
  }
  alttext?: {
    alt_text: string
    raw_caption?: string
    detailed_caption?: string
    enhanced_description?: string
    ocr_text?: string
    all_captions?: string[]
    image_info?: {
      width: number
      height: number
      aspect_ratio: number
    }
    model?: string
    confidence?: number
  }
  transcript?: {
    text: string
    language?: string
    model?: string
    chars?: number
    words?: number
    speaker_count?: number
    duration?: number
    segments?: Array<{
      text: string
      speaker: number
      start: number
      end: number
    }>
    speaker_turns?: Array<{
      speaker: number
      text: string
      start: number
      end: number
      duration: number
      segment_count: number
      word_count: number
      segments: Array<{
        text: string
        speaker: number
        start: number
        end: number
      }>
    }>
    error?: string
    note?: string
  }
  video?: {
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
    video_url?: string 
  }
}

const mockResults: Results = {
  simplification: {
    original:
      "The implementation of Universal Design for Learning (UDL) principles necessitates a comprehensive understanding of neurodiversity and the multifaceted nature of cognitive processing across diverse learner populations.",
    simplified:
      "Universal Design for Learning (UDL) helps us understand that everyone learns differently. We need to know how different brains work to help all students learn better.",
  },
  translation: {
    original: "Universal Design for Learning helps everyone learn better.",
    translations: {
      Spanish: {
        text: "El Diseño Universal para el Aprendizaje ayuda a todos a aprender mejor.",
        native_name: "Español",
        language_code: "es"
      },
      French: {
        text: "La Conception Universelle de l'Apprentissage aide tout le monde à mieux apprendre.",
        native_name: "Français",
        language_code: "fr"
      },
      German: {
        text: "Universelles Design für Lernen hilft allen besser zu lernen.",
        native_name: "Deutsch",
        language_code: "de"
      },
      Chinese: {
        text: "通用学习设计帮助每个人更好地学习。",
        native_name: "中文",
        language_code: "zh"
      },
    },
  },
  similarity: {
    score: 0.87,
    interpretation:
      "High semantic similarity - the simplified text preserves 87% of the original meaning while improving readability.",
  },
  bias: {
    detected: false,
    flags: [],
    report:
      "No significant bias detected in the content. The language is inclusive and appropriate for diverse audiences.",
  },
  wcag: {
    score: 92,
    level: "AA",
    issues: [
      { type: "warning", message: "Consider adding more descriptive link text" },
      { type: "info", message: "Heading hierarchy is well structured" },
    ],
  },
  signlanguage: {
    gloss: "UNIVERSAL DESIGN LEARN HELP ALL PEOPLE LEARN BETTER",
    note: "This is a prototype sign language gloss representation. In production, this would include visual signing guides.",
  },
}

export function ResultsDashboard() {
  const [results, setResults] = useState<Results>(mockResults)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [simpleMode, setSimpleMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("") // For translation dropdown

  useEffect(() => {
    const storedResults = sessionStorage.getItem("udl-results")
    if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults)
        console.log("🔍 Loaded results from sessionStorage:", parsed)
        console.log("🖼️ Alt text data:", parsed.alttext)
        
        const mergedResults: Results = {
          extraction: parsed.extraction ? {
            text: parsed.extraction.text || "",
            method: parsed.extraction.method || "",
            note: parsed.extraction.note
          } : undefined,
          simplification: {
            original: parsed.simplification?.original || mockResults.simplification?.original || "",
            simplified: parsed.simplification?.simplified || mockResults.simplification?.simplified || "",
          },
          translation: {
            original: parsed.translation?.original || mockResults.translation?.original || "",
            translations: parsed.translation?.translations || mockResults.translation?.translations || {},
          },
          similarity: {
            score: parsed.similarity?.score ?? mockResults.similarity?.score ?? 0,
            interpretation: parsed.similarity?.interpretation || mockResults.similarity?.interpretation || "",
          },
          bias: parsed.bias ? {
            success: parsed.bias.success,
            overall_bias_detected: parsed.bias.overall_bias_detected ?? false,
            bias_score: parsed.bias.bias_score ?? 100,
            flags: parsed.bias.flags || [],
            suggestions: parsed.bias.suggestions || [],
            categories: parsed.bias.categories || [],
            detailed_report: parsed.bias.detailed_report || ""
          } : mockResults.bias,
          wcag: parsed.wcag || mockResults.wcag,
          alttext: parsed.alttext ? {
            alt_text: parsed.alttext.alt_text || "",
            raw_caption: parsed.alttext.raw_caption,
            detailed_caption: parsed.alttext.detailed_caption,
            enhanced_description: parsed.alttext.enhanced_description,
            ocr_text: parsed.alttext.ocr_text,
            all_captions: parsed.alttext.all_captions,
            image_info: parsed.alttext.image_info,
            model: parsed.alttext.model,
            confidence: parsed.alttext.confidence
          } : undefined,
          transcript: parsed.transcript ? {
            text: parsed.transcript.text || "",
            language: parsed.transcript.language,
            model: parsed.transcript.model,
            chars: parsed.transcript.chars,
            words: parsed.transcript.words,
            speaker_count: parsed.transcript.speaker_count,
            segments: parsed.transcript.segments,
            speaker_turns: parsed.transcript.speaker_turns,
            duration: parsed.transcript.duration
          } : undefined,
          video: parsed.video ? {
            full_transcript: parsed.video.full_transcript || "",
            simplified_transcript: parsed.video.simplified_transcript || "",
            captions: parsed.video.captions || [],
            vtt_content: parsed.video.vtt_content || "",
            speaker_segments: parsed.video.speaker_segments || [],
            video_info: parsed.video.video_info || { duration: 0, has_audio: true },
            word_count: parsed.video.word_count || 0,
            duration: parsed.video.duration || 0,
            speaker_count: parsed.video.speaker_count || 1,
            accessibility_features: parsed.video.accessibility_features,
            video_url: parsed.video.video_url
          } : undefined,
        }
        
        console.log("🔍 DEBUG results-dashboard: Parsed transcript data:", parsed.transcript)
        console.log("🔍 DEBUG results-dashboard: Speaker turns:", parsed.transcript?.speaker_turns)
        console.log("🔍 DEBUG results-dashboard: Speaker count:", parsed.transcript?.speaker_count)
        console.log("🖼️ DEBUG results-dashboard: Final alttext in mergedResults:", mergedResults.alttext)
        console.log("🚨 DEBUG BIAS DATA:", JSON.stringify(parsed.bias, null, 2))
        console.log("🚨 BIAS overall_bias_detected:", parsed.bias?.overall_bias_detected)
        console.log("🚨 BIAS flags count:", parsed.bias?.flags?.length)
        
        setResults(mergedResults)
      } catch (error) {
        console.error("❌ Error loading results:", error)
        setResults(mockResults)
      }
    }
  }, [])

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85 
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Accessibility Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimpleMode(!simpleMode)}
            aria-label={simpleMode ? "Show detailed view" : "Show simple view"}
          >
            {simpleMode ? "📖 Detailed" : "✨ Simple"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Toggle help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Volume2 className="h-4 w-4 animate-pulse" aria-hidden="true" />
            <span>Reading aloud...</span>
          </div>
        )}
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg" role="alert">
          <h4 className="font-semibold text-foreground mb-3 text-lg">How to Use the Results Dashboard:</h4>
          <ul className="list-disc list-inside space-y-2 text-foreground">
            <li className="text-base">Click the tabs to view different results (Simplified, Translated, etc.)</li>
            <li className="text-base">Use the speaker icon 🔊 to hear text read aloud</li>
            <li className="text-base">Click the copy icon to copy text to your clipboard</li>
            <li className="text-base">Switch to Simple mode for easier-to-read descriptions</li>
            <li className="text-base">All content has been optimized for screen readers</li>
          </ul>
        </div>
      )}

      <Tabs defaultValue="simplified" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-card p-1">
        <TabsTrigger value="simplified" className="gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Simplified</span>
        </TabsTrigger>
        <TabsTrigger value="translated" className="gap-2">
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Translated</span>
        </TabsTrigger>
        <TabsTrigger value="similarity" className="gap-2">
          <BarChart className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Similarity</span>
        </TabsTrigger>
        <TabsTrigger value="alttext" className="gap-2">
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Alt Text</span>
        </TabsTrigger>
        <TabsTrigger value="transcript" className="gap-2">
          <Mic className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Transcript</span>
        </TabsTrigger>
        <TabsTrigger value="wcag" className="gap-2">
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">WCAG</span>
        </TabsTrigger>
        <TabsTrigger value="bias" className="gap-2">
          <Shield className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Bias</span>
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-2">
          <Video className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Video</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="simplified">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                Original Text
                <CopyButton
                  text={results.simplification?.original || ""}
                  field="original"
                  copied={copiedField === "original"}
                  onCopy={copyToClipboard}
                />
              </CardTitle>
              <CardDescription>The original complex content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{results.simplification?.original}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Simplified Text
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    AI Generated
                  </Badge>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(results.simplification?.simplified || "")}
                    aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                  >
                    {isSpeaking ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <CopyButton
                    text={results.simplification?.simplified || ""}
                    field="simplified"
                    copied={copiedField === "simplified"}
                    onCopy={copyToClipboard}
                  />
                </div>
              </CardTitle>
              <CardDescription>
                {simpleMode ? "Easy to read version" : "AI-simplified text with improved readability for better comprehension"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="simplified-text text-foreground leading-relaxed">{results.simplification?.simplified}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cognitive Load Analysis */}
        <div className="mt-6">
          <CognitiveLoadIndicator text={results.simplification?.simplified || ""} />
        </div>

        {/* Export Options */}
        <div className="mt-4 p-4 bg-card border rounded-lg">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Accessible Formats
          </h4>
          <ExportAccessibleFormats
            content={{
              original: results.simplification?.original || "",
              simplified: results.simplification?.simplified || "",
              translations: results.translation?.translations
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="translated">
        <TranslationTab 
          originalText={results.simplification?.simplified || results.extraction?.text || ""}
        />
      </TabsContent>

      <TabsContent value="similarity">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Semantic Similarity Score</CardTitle>
            <CardDescription>How well the simplified text preserves the original meaning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={(results.similarity?.score || 0) * 100} className="h-4" />
              </div>
              <span className="text-3xl font-bold text-primary">
                {Math.round((results.similarity?.score || 0) * 100)}%
              </span>
            </div>
            <p className="text-muted-foreground">{results.similarity?.interpretation}</p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">0-60%</div>
                <div className="text-sm text-muted-foreground">Low Similarity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-4">60-80%</div>
                <div className="text-sm text-muted-foreground">Moderate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">80-100%</div>
                <div className="text-sm text-muted-foreground">High Similarity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alttext">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Generated Alt Text</CardTitle>
            <CardDescription>AI-generated descriptions for images</CardDescription>
          </CardHeader>
          <CardContent>
            {results.alttext?.alt_text ? (
              <div className="space-y-6">
                {/* Image Preview */}
                {typeof window !== 'undefined' && sessionStorage.getItem("udl-alttext-image") && (
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <img 
                        src={sessionStorage.getItem("udl-alttext-image") || ""} 
                        alt="Uploaded image for alt text generation"
                        className="w-full h-auto rounded-lg border border-border"
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Alt Text Card */}
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Alt Text Description
                      </span>
                      <CopyButton
                        text={results.alttext.alt_text}
                        field="alttext"
                        copied={copiedField === "alttext"}
                        onCopy={copyToClipboard}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-foreground leading-relaxed">{results.alttext.alt_text}</p>
                    
                    {/* Model metadata badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {results.alttext.model && (
                        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {results.alttext.model}
                        </Badge>
                      )}
                      {results.alttext.confidence && (
                        <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {Math.round(results.alttext.confidence * 100)}% Accuracy
                        </Badge>
                      )}
                      {results.alttext.image_info && (
                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {results.alttext.image_info.width} × {results.alttext.image_info.height}px
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* What This Image Shows - Enhanced Description from Groq */}
                {(results.alttext as any)?.enhanced_description && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        <Sparkles className="h-5 w-5 text-primary" />
                        What This Image Shows
                      </CardTitle>
                      <CardDescription>Explanation of the subject and content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base text-foreground leading-relaxed">
                        {(results.alttext as any).enhanced_description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="bg-secondary rounded-lg p-6 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <p className="text-muted-foreground mb-4">No images were uploaded for processing.</p>
                <p className="text-sm text-muted-foreground">
                  Upload an image to generate accessible alt text descriptions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transcript">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              Audio Transcript
            </CardTitle>
            <CardDescription>AI-powered speech-to-text with speaker diarization (AssemblyAI)</CardDescription>
          </CardHeader>
          <CardContent>
            {results.transcript?.text ? (
              <div className="space-y-6">
                {/* Transcript Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {results.transcript.speaker_count !== undefined && (
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Speakers</div>
                      <div className="text-lg font-semibold text-foreground">{results.transcript.speaker_count}</div>
                    </div>
                  )}
                  {results.transcript.language && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Language</div>
                      <div className="text-lg font-semibold text-foreground">{results.transcript.language}</div>
                    </div>
                  )}
                  {results.transcript.words && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Words</div>
                      <div className="text-lg font-semibold text-foreground">{results.transcript.words.toLocaleString()}</div>
                    </div>
                  )}
                  {results.transcript.duration && (
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Duration</div>
                      <div className="text-lg font-semibold text-foreground">
                        {Math.floor(results.transcript.duration / 60)}:{String(Math.floor(results.transcript.duration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                  {results.transcript.segments && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Segments</div>
                      <div className="text-lg font-semibold text-foreground">{results.transcript.segments.length}</div>
                    </div>
                  )}
                </div>

                {/* Main Transcript Display */}
                <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-2 border-primary/20 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-lg flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        Full Transcription
                      </span>
                      <CopyButton
                        text={results.transcript.text}
                        field="transcript"
                        copied={copiedField === "transcript"}
                        onCopy={copyToClipboard}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="relative">
                      {/* Decorative gradient overlay */}
                      <div className="absolute -top-3 -left-3 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
                      
                      <div className="relative bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 max-h-[600px] overflow-y-auto">
                        {results.transcript.speaker_turns && results.transcript.speaker_turns.length > 0 ? (
                          <div className="divide-y divide-border/30">
                            {results.transcript.speaker_turns.map((turn: any, turnIdx: number) => {
                              const speakerColors = [
                                { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', avatar: 'bg-blue-500' },
                                { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', avatar: 'bg-purple-500' },
                                { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', avatar: 'bg-green-500' },
                                { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', avatar: 'bg-orange-500' },
                              ];
                              
                              const speaker = speakerColors[turn.speaker % speakerColors.length];
                              const prevTurn = turnIdx > 0 ? results.transcript.speaker_turns[turnIdx - 1] : null;
                              const pauseBeforeTurn = prevTurn ? turn.start - prevTurn.end : 0;
                              
                              return (
                                <div key={turnIdx}>
                                  {turnIdx > 0 && pauseBeforeTurn > 1.5 && (
                                    <div className="flex items-center justify-center py-3 bg-secondary/30">
                                      <div className="h-px bg-border/50 flex-1"></div>
                                      <span className="text-xs text-muted-foreground px-3 font-medium">
                                        {pauseBeforeTurn.toFixed(1)}s pause
                                      </span>
                                      <div className="h-px bg-border/50 flex-1"></div>
                                    </div>
                                  )}
                                  
                                  <div className={`group hover:bg-accent/20 transition-all duration-200 p-6 ${turnIdx === 0 ? 'pt-6' : ''}`}>
                                    <div className="flex items-start gap-4">
                                      {/* Speaker Avatar */}
                                      <div className="flex-shrink-0 pt-1">
                                        <div className={`w-12 h-12 rounded-full ${speaker.avatar} flex items-center justify-center shadow-lg ring-2 ring-background`}>
                                          <span className="text-white font-bold text-base">
                                            {String.fromCharCode(65 + turn.speaker)}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Message Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                          <span className={`font-bold text-base ${speaker.text}`}>
                                            Speaker {String.fromCharCode(65 + turn.speaker)}
                                          </span>
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 border border-border/50 rounded-full text-xs font-mono text-muted-foreground">
                                            <span className="text-[10px]">▶</span>
                                            {Math.floor(turn.start / 60)}:{String(Math.floor(turn.start % 60)).padStart(2, '0')}
                                          </span>
                                          <span className="text-xs text-muted-foreground/70">
                                            {turn.duration}s · {turn.segment_count} segments
                                          </span>
                                        </div>
                                        
                                        <div className={`${speaker.bg} ${speaker.border} border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm`}>
                                          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                            {turn.text.trim()}
                                          </p>
                                        </div>
                                        
                                        {/* Show individual timestamps for segments within turn */}
                                        {turn.segment_count > 3 && turn.segments && (
                                          <div className="mt-3 flex flex-wrap gap-2">
                                            {turn.segments.map((seg: any, segIdx: number) => (
                                              <span key={segIdx} className="text-xs text-muted-foreground/50 font-mono">
                                                {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, '0')}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : results.transcript.segments && results.transcript.segments.length > 0 ? (
                          <div className="divide-y divide-border/30">
                            {results.transcript.segments.map((segment: any, idx: number) => {
                              const speakerColors = [
                                { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', avatar: 'bg-blue-500' },
                                { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', avatar: 'bg-purple-500' },
                                { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', avatar: 'bg-green-500' },
                                { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', avatar: 'bg-orange-500' },
                              ];
                              
                              const speaker = speakerColors[(segment.speaker || 0) % speakerColors.length];
                              const prevSegment = idx > 0 ? results.transcript.segments[idx - 1] : null;
                              const pauseDuration = prevSegment ? segment.start - prevSegment.end : 0;
                              const isSpeakerChange = prevSegment && segment.speaker !== prevSegment.speaker;
                              
                              return (
                                <div key={idx}>
                                  {isSpeakerChange && pauseDuration > 1.5 && (
                                    <div className="flex items-center justify-center py-3 bg-secondary/30">
                                      <div className="h-px bg-border/50 flex-1"></div>
                                      <span className="text-xs text-muted-foreground px-3 font-medium">
                                        {pauseDuration.toFixed(1)}s pause
                                      </span>
                                      <div className="h-px bg-border/50 flex-1"></div>
                                    </div>
                                  )}
                                  
                                  <div className={`group hover:bg-accent/20 transition-all duration-200 p-6 ${idx === 0 ? 'pt-6' : ''}`}>
                                    <div className="flex items-start gap-4">
                                      <div className="flex-shrink-0 pt-1">
                                        <div className={`w-10 h-10 rounded-full ${speaker.avatar} flex items-center justify-center shadow-lg ring-2 ring-background`}>
                                          <span className="text-white font-semibold text-sm">
                                            {String.fromCharCode(65 + (segment.speaker || 0))}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span className={`font-semibold ${speaker.text}`}>
                                            Speaker {String.fromCharCode(65 + (segment.speaker || 0))}
                                          </span>
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 border border-border/50 rounded-full text-xs font-mono text-muted-foreground">
                                            <span className="text-[10px]">●</span>
                                            {segment.timestamp || `${Math.floor(segment.start / 60)}:${String(Math.floor(segment.start % 60)).padStart(2, '0')}`}
                                          </span>
                                        </div>
                                        
                                        <div className={`${speaker.bg} ${speaker.border} border rounded-2xl rounded-tl-sm px-4 py-3`}>
                                          <p className="text-base text-foreground leading-relaxed">
                                            {segment.text.trim()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : results.transcript.text ? (
                          <div className="divide-y divide-border/30">
                            {(() => {
                              const lines = results.transcript.text.split('\n').filter((line: string) => line.trim());
                              const timestampedLines = lines.filter((line: string) => line.match(/^\[(\d+:\d+)\]\s*(.+)/));
                              
                              // If we have timestamped lines, use them; otherwise show all lines
                              const linesToShow = timestampedLines.length > 0 ? timestampedLines : lines;
                              
                              return linesToShow.map((line: string, idx: number) => {
                                const timestampMatch = line.match(/^\[(\d+:\d+)\]\s*(.+)/);
                                const text = timestampMatch ? timestampMatch[2] : line;
                                const timestamp = timestampMatch ? timestampMatch[1] : null;
                                
                                // Simple speaker alternation - change every 3-5 lines
                                const speakerIndex = Math.floor(idx / 4);
                                
                                const speakerColors = [
                                  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', avatar: 'bg-blue-500' },
                                  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', avatar: 'bg-purple-500' },
                                  { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', avatar: 'bg-green-500' },
                                  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', avatar: 'bg-orange-500' },
                                ];
                                
                                const speaker = speakerColors[speakerIndex % speakerColors.length];
                                const showSpeakerChange = idx > 0 && idx % 4 === 0;
                                
                                return (
                                  <div key={idx}>
                                    {showSpeakerChange && (
                                      <div className="flex items-center justify-center py-3 bg-secondary/30">
                                        <div className="h-px bg-border/50 flex-1"></div>
                                        <span className="text-xs text-muted-foreground px-3 font-medium">
                                          Speaker Change
                                        </span>
                                        <div className="h-px bg-border/50 flex-1"></div>
                                      </div>
                                    )}
                                    
                                    <div className={`group hover:bg-accent/20 transition-all duration-200 p-6 ${idx === 0 ? 'pt-6' : ''}`}>
                                      <div className="flex items-start gap-4">
                                        {/* Speaker Avatar */}
                                        <div className="flex-shrink-0 pt-1">
                                          <div className={`w-10 h-10 rounded-full ${speaker.avatar} flex items-center justify-center shadow-lg ring-2 ring-background`}>
                                            <span className="text-white font-semibold text-sm">
                                              {String.fromCharCode(65 + (speakerIndex % 26))}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className={`font-semibold ${speaker.text}`}>
                                              Speaker {String.fromCharCode(65 + (speakerIndex % 26))}
                                            </span>
                                            {timestamp && (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 border border-border/50 rounded-full text-xs font-mono text-muted-foreground">
                                                <span className="text-[10px]">●</span>
                                                {timestamp}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className={`${speaker.bg} ${speaker.border} border rounded-2xl rounded-tl-sm px-4 py-3`}>
                                            <p className="text-base text-foreground leading-relaxed">
                                              {text.trim()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-muted-foreground">No transcript data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            ) : results.transcript?.error ? (
              <div className="bg-destructive/10 border-destructive/30 border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-2">Transcription Failed</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{results.transcript.error}</p>
                    {results.transcript.note && (
                      <p className="text-sm text-muted-foreground italic">{results.transcript.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary rounded-lg p-12 text-center border-2 border-dashed border-border">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-4">
                    <Mic className="h-16 w-16 text-purple-400" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">No Audio Transcription Available</p>
                  <p className="text-muted-foreground mb-4">Upload an audio file to generate AI-powered transcriptions</p>
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      MP3, WAV, M4A
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Up to 50MB
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      99%+ Accuracy
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="wcag">
        <div className="space-y-6">
          {/* Header Card with Overall Score */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                WCAG 2.2 Accessibility Compliance
                <Badge
                  variant="secondary"
                  className={`text-lg px-4 py-2 ${
                    results.wcag?.wcag_level === "AAA" ? "bg-green-500/20 text-green-500" :
                    results.wcag?.wcag_level === "AA" ? "bg-blue-500/20 text-blue-500" :
                    results.wcag?.wcag_level === "A" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-red-500/20 text-red-500"
                  }`}
                >
                  Level {results.wcag?.wcag_level || "N/A"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive analysis across all 4 WCAG principles (POUR)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Compliance</span>
                  <span className="text-4xl font-bold text-primary">{results.wcag?.overall_score || 0}%</span>
                </div>
                <Progress value={results.wcag?.overall_score || 0} className="h-3" />
              </div>

              {/* Compliance by WCAG Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Level A</span>
                    <span className="text-2xl font-bold text-yellow-500">
                      {results.wcag?.compliance_by_level?.A || 0}%
                    </span>
                  </div>
                  <Progress value={results.wcag?.compliance_by_level?.A || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Minimum compliance</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Level AA</span>
                    <span className="text-2xl font-bold text-blue-500">
                      {results.wcag?.compliance_by_level?.AA || 0}%
                    </span>
                  </div>
                  <Progress value={results.wcag?.compliance_by_level?.AA || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Standard target</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Level AAA</span>
                    <span className="text-2xl font-bold text-green-500">
                      {results.wcag?.compliance_by_level?.AAA || 0}%
                    </span>
                  </div>
                  <Progress value={results.wcag?.compliance_by_level?.AAA || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Excellence goal</p>
                </div>
              </div>

              {/* POUR Principles */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">POUR Principles Compliance</h4>
                <div className="space-y-3">
                  {results.wcag?.principle_scores && Object.entries(results.wcag.principle_scores).map(([principle, score]) => (
                    <div key={principle} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
                          {score >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          {principle}
                        </span>
                        <span className={`text-sm font-bold ${score >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues Card */}
          {results.wcag?.issues && results.wcag.issues.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Accessibility Issues ({results.wcag.issues.length})
                </CardTitle>
                <CardDescription>Issues prioritized by severity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.wcag.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      issue.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
                      issue.severity === 'high' ? 'bg-orange-500/10 border-orange-500' :
                      issue.severity === 'moderate' ? 'bg-yellow-500/10 border-yellow-500' :
                      'bg-blue-500/10 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {issue.criterion}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              issue.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                              issue.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                              issue.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-blue-500/20 text-blue-500'
                            }`}
                          >
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.principle}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Level {issue.level}
                          </Badge>
                        </div>
                        <h5 className="font-semibold text-foreground mb-1">{issue.name}</h5>
                        <p className="text-sm text-foreground mb-2">{issue.issue}</p>
                        <p className="text-xs text-muted-foreground italic">
                          Impact: {issue.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations Card */}
          {results.wcag?.recommendations && results.wcag.recommendations.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Remediation Recommendations
                </CardTitle>
                <CardDescription>Actionable steps to improve accessibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.wcag.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className={`text-lg ${
                      rec.priority === 'critical' ? '❗' :
                      rec.priority === 'high' ? '⚠️' : 'ℹ️'
                    }`}>
                      {rec.priority === 'critical' ? '❗' :
                       rec.priority === 'high' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {rec.criterion}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            rec.priority === 'critical' ? 'bg-red-500/20 text-red-500' :
                            rec.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detailed Report */}
          {results.wcag?.detailed_report && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  Detailed Compliance Report
                  <CopyButton
                    text={results.wcag.detailed_report}
                    field="wcag-report"
                    copied={copiedField === "wcag-report"}
                    onCopy={copyToClipboard}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono whitespace-pre-wrap text-foreground bg-muted/50 p-4 rounded-lg overflow-auto max-h-96">
                  {results.wcag.detailed_report}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* No Issues State */}
          {(!results.wcag?.issues || results.wcag.issues.length === 0) && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="flex items-center gap-4 p-6">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-500 mb-1">
                    No Accessibility Issues Detected!
                  </h3>
                  <p className="text-sm text-foreground">
                    Your content meets all automated WCAG 2.2 accessibility checks.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="bias">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              Bias Detection Report
              <Badge
                variant="secondary"
                className={`${
                  (results.bias?.overall_bias_detected || (results.bias?.flags && results.bias.flags.length > 0)) ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                }`}
              >
                {(results.bias?.overall_bias_detected || (results.bias?.flags && results.bias.flags.length > 0)) ? "Bias Detected" : "No Bias Detected"}
              </Badge>
            </CardTitle>
            <CardDescription>Analysis for potentially biased or exclusionary language</CardDescription>
          </CardHeader>
          <CardContent>
            {results.bias?.bias_score !== undefined && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Bias Score</span>
                  <span className={`text-lg font-bold ${
                    results.bias.bias_score >= 70 ? "text-primary" : "text-destructive"
                  }`}>
                    {results.bias.bias_score}%
                  </span>
                </div>
                <Progress 
                  value={results.bias.bias_score} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  100% = No Bias Detected
                </p>
              </div>
            )}

            <div className={`p-4 rounded-lg ${(results.bias?.overall_bias_detected || (results.bias?.flags && results.bias.flags.length > 0)) ? "bg-destructive/10" : "bg-primary/10"}`}>
              <div className="flex items-start gap-3">
                {(results.bias?.overall_bias_detected || (results.bias?.flags && results.bias.flags.length > 0)) ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                )}
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{results.bias?.detailed_report || "No detailed report available."}</pre>
              </div>
            </div>

            {results.bias?.flags && results.bias.flags.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-foreground">Flagged Content ({results.bias.flags.length})</h4>
                {results.bias.flags.map((flag, index) => (
                  <div key={index} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {flag.type.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${
                        flag.severity === 'high' ? 'border-destructive text-destructive' : 'border-orange-500 text-orange-500'
                      }`}>
                        {flag.severity} severity
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mt-2">
                      {flag.matched_text || flag.text}
                    </p>
                    {flag.confidence && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {(flag.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="video">
        <VideoTab 
          videoData={results.video}
          simplifiedText={results.simplification?.simplified || ""}
        />
      </TabsContent>
      </Tabs>
    </div>
  )
}

interface CopyButtonProps {
  text: string
  field: string
  copied: boolean
  onCopy: (text: string, field: string) => void
}

function CopyButton({ text, field, copied, onCopy }: CopyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => onCopy(text, field)}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}

function TranslationTab({ originalText }: { originalText: string }) {
  const [allLanguages, setAllLanguages] = useState<Record<string, { name: string; native_name: string; gtts_code: string }>>({})
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [translation, setTranslation] = useState<{ text: string; native_name: string; language_code: string; audio?: string } | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function loadLanguages() {
      setIsLoadingLanguages(true)
      try {
        const { getSupportedLanguages } = await import("@/lib/api")
        const response = await getSupportedLanguages()
        console.log("Languages API response:", response)
        if (response.success && response.languages) {
          setAllLanguages(response.languages)
        } else {
          console.error("Failed to load languages:", response)
        }
      } catch (error) {
        console.error("Failed to load languages:", error)
      } finally {
        setIsLoadingLanguages(false)
      }
    }
    loadLanguages()
  }, [])

  const handleTranslate = async (languageCode: string) => {
    if (!languageCode || !originalText) return
    
    setIsTranslating(true)
    setTranslation(null)
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }

    try {
      const { translateToLanguage } = await import("@/lib/api")
      const response = await translateToLanguage(originalText, languageCode, true)
      
      if (response.success && response.result) {
        const result = response.result as { translations?: Record<string, { text: string; native_name: string; language_code: string; audio?: string }> }
        const translations = result.translations || {}
        const langName = Object.keys(translations)[0]
        if (langName && translations[langName]) {
          setTranslation(translations[langName])
        }
      }
    } catch (error) {
      console.error("Translation failed:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code)
    handleTranslate(code)
  }

  const toggleAudio = () => {
    if (!translation?.audio) return

    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(`data:audio/mp3;base64,${translation.audio}`)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        audioRef.current = null
      }

      audio.play()
      setIsPlaying(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsPlaying(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const indianCodes = ["hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur"]
  
  const indianLanguages = Object.entries(allLanguages)
    .filter(([code]) => indianCodes.includes(code))
    .sort((a, b) => (a[1]?.name || "").localeCompare(b[1]?.name || ""))
  
  const worldLanguages = Object.entries(allLanguages)
    .filter(([code]) => !indianCodes.includes(code))
    .sort((a, b) => (a[1]?.name || "").localeCompare(b[1]?.name || ""))

  const filteredIndian = indianLanguages.filter(([code, lang]) => 
    (lang?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lang?.native_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredWorld = worldLanguages.filter(([code, lang]) => 
    (lang?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lang?.native_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalLanguages = Object.keys(allLanguages).length

  if (!originalText) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-secondary rounded-full">
              <Languages className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">No Text Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please upload and process content first to translate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Instant Translation</CardTitle>
                <CardDescription className="mt-1">
                  {isLoadingLanguages 
                    ? "Loading languages..."
                    : `${totalLanguages} languages available with FREE text-to-speech`
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                100% FREE
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoadingLanguages ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading {totalLanguages || "40+"} languages...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search languages... (e.g., Hindi, Spanish, தமிழ்)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Language Selection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Indian Languages */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <CardTitle className="text-lg text-foreground">Indian Languages</CardTitle>
                    <CardDescription>{filteredIndian.length} languages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredIndian.map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageSelect(code)}
                      disabled={isTranslating}
                      className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                        selectedLanguage === code 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50"
                      } ${isTranslating && selectedLanguage === code ? "animate-pulse" : ""}`}
                    >
                      <div className="font-medium text-sm">{lang?.native_name || code}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{lang?.name || ""}</div>
                    </button>
                  ))}
                  {filteredIndian.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground py-4 text-center">
                      No Indian languages match your search
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* World Languages */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <CardTitle className="text-lg text-foreground">World Languages</CardTitle>
                    <CardDescription>{filteredWorld.length} languages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredWorld.map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageSelect(code)}
                      disabled={isTranslating}
                      className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                        selectedLanguage === code 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50"
                      } ${isTranslating && selectedLanguage === code ? "animate-pulse" : ""}`}
                    >
                      <div className="font-medium text-sm">{lang?.native_name || code}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{lang?.name || ""}</div>
                    </button>
                  ))}
                  {filteredWorld.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground py-4 text-center">
                      No world languages match your search
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation Result */}
          {(isTranslating || translation) && (
            <Card className="bg-gradient-to-br from-secondary/80 to-secondary border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Languages className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {isTranslating 
                          ? `Translating to ${allLanguages[selectedLanguage]?.native_name || selectedLanguage}...`
                          : `${translation?.native_name || ""} Translation`
                        }
                      </CardTitle>
                      <CardDescription>
                        {isTranslating ? "Please wait..." : `Language code: ${selectedLanguage}`}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Audio & Copy Controls */}
                  {!isTranslating && translation && (
                    <div className="flex items-center gap-2">
                      {translation.audio && (
                        <>
                          <Button
                            variant={isPlaying ? "default" : "outline"}
                            size="sm"
                            onClick={toggleAudio}
                            className="gap-1"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4" />
                                Listen
                              </>
                            )}
                          </Button>
                          {isPlaying && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={stopAudio}
                              className="gap-1"
                            >
                              <Square className="h-4 w-4" />
                              Stop
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(translation.text, selectedLanguage)}
                      >
                        {copiedField === selectedLanguage ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {isTranslating ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">
                        Translating...
                      </p>
                    </div>
                  </div>
                ) : translation ? (
                  <div className="space-y-4">
                    {/* Translation Text */}
                    <div className="p-4 bg-background/50 rounded-lg border border-border">
                      <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                        {translation.text}
                      </p>
                    </div>
                    
                    {/* Audio Waveform Indicator */}
                    {isPlaying && (
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                        <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                        <div className="flex gap-1">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-primary rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 16 + 8}px`,
                                animationDelay: `${i * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-primary ml-2">Playing audio...</span>
                      </div>
                    )}
                    
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Initial State - No language selected */}
          {!selectedLanguage && !isTranslating && !translation && (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-secondary rounded-full">
                    <Languages className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Select a Language</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose any language above to instantly translate your content
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}


/**
 * VideoTab
 */
interface VideoTabProps {
  videoData?: {
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
    video_url?: string
  }
  simplifiedText: string
}

function VideoTab({ videoData, simplifiedText }: VideoTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentCaption, setCurrentCaption] = useState<string>("")
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("")
  const [showSimplified, setShowSimplified] = useState(false)
  const [captionSize, setCaptionSize] = useState<"normal" | "large" | "xlarge">("normal")
  const [captionPosition, setCaptionPosition] = useState<"bottom" | "top">("bottom")
  const [highContrast, setHighContrast] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState(videoData)

  useEffect(() => {
    if (processedData?.captions) {
      const caption = processedData.captions.find(
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
  }, [currentTime, processedData])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("video", file)

      const response = await fetch("http://localhost:8000/process/video", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      
      if (data.success && data.result) {
        setProcessedData(data.result)
        const existingResults = sessionStorage.getItem("udl-results")
        if (existingResults) {
          const parsed = JSON.parse(existingResults)
          parsed.video = data.result
          parsed.video.video_url = URL.createObjectURL(file)
          sessionStorage.setItem("udl-results", JSON.stringify(parsed))
        }
      } else {
        console.error("Video processing failed:", data.error)
      }
    } catch (error) {
      console.error("Video upload error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const downloadVTT = () => {
    if (!processedData?.vtt_content) return
    
    const blob = new Blob([processedData.vtt_content], { type: "text/vtt" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "captions.vtt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const captionSizeClasses = {
    normal: "text-lg",
    large: "text-2xl",
    xlarge: "text-4xl"
  }

  return (
    <div className="space-y-6">
      {/* Video Upload Section */}
      {!processedData && !videoUrl && (
        <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-2 border-dashed border-violet-500/30">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="p-4 bg-violet-500/10 rounded-full w-fit mx-auto mb-4">
                <Video className="h-12 w-12 text-violet-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Upload Video for Real-Time Captioning
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload a video to generate accessible captions with speaker diarization.
                Designed for deaf and cognitive disabled users.
              </p>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors">
                  <Video className="h-5 w-5" />
                  Choose Video File
                </div>
              </label>
              
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: MP4, WebM, AVI, MOV • Max size: 50MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Processing Video...
              </h3>
              <p className="text-muted-foreground">
                Extracting audio, generating captions, and analyzing speakers.
                This may take a few moments.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Player with Captions */}
      {(videoUrl || processedData?.video_url) && !isProcessing && (
        <div className="space-y-4">
          {/* Video Container */}
          <Card className="bg-black overflow-hidden relative">
            <div className="relative">
              <video
                ref={videoRef}
                src={videoUrl || processedData?.video_url}
                className="w-full aspect-video"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Live Caption Overlay */}
              {currentCaption && (
                <div 
                  className={`absolute left-0 right-0 px-4 py-2 flex justify-center ${
                    captionPosition === "bottom" ? "bottom-16" : "top-4"
                  }`}
                >
                  <div 
                    className={`px-4 py-2 rounded-lg max-w-[80%] text-center ${
                      highContrast 
                        ? "bg-black text-yellow-300 border-2 border-yellow-300" 
                        : "bg-black/80 text-white"
                    } ${captionSizeClasses[captionSize]}`}
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(-10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex-1 text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(processedData?.duration || 0)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-violet-500/20 text-violet-300">
                      <Subtitles className="h-3 w-3 mr-1" />
                      CC
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Accessibility Controls */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Caption Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Caption Size */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Size</label>
                  <div className="flex gap-1">
                    {(["normal", "large", "xlarge"] as const).map((size) => (
                      <Button
                        key={size}
                        variant={captionSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCaptionSize(size)}
                        className="flex-1 text-xs"
                      >
                        {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Position</label>
                  <div className="flex gap-1">
                    <Button
                      variant={captionPosition === "bottom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCaptionPosition("bottom")}
                      className="flex-1 text-xs"
                    >
                      Bottom
                    </Button>
                    <Button
                      variant={captionPosition === "top" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCaptionPosition("top")}
                      className="flex-1 text-xs"
                    >
                      Top
                    </Button>
                  </div>
                </div>

                {/* High Contrast */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Contrast</label>
                  <Button
                    variant={highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHighContrast(!highContrast)}
                    className="w-full text-xs"
                  >
                    {highContrast ? "High Contrast ✓" : "Normal"}
                  </Button>
                </div>

                {/* View Mode */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Text Mode</label>
                  <Button
                    variant={showSimplified ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSimplified(!showSimplified)}
                    className="w-full text-xs"
                  >
                    {showSimplified ? "Simplified ✓" : "Full Text"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transcript and Data Display */}
      {processedData && !isProcessing && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-violet-500" />
                Video Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-lg font-semibold">
                    {formatTime(processedData.duration)}
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-xs text-muted-foreground">Speakers</div>
                  <div className="text-lg font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4 text-violet-500" />
                    {processedData.speaker_count}
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-xs text-muted-foreground">Words</div>
                  <div className="text-lg font-semibold">
                    {processedData.word_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-xs text-muted-foreground">Captions</div>
                  <div className="text-lg font-semibold">
                    {processedData.captions.length}
                  </div>
                </div>
              </div>

              {/* Accessibility Features */}
              {processedData.accessibility_features && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {processedData.accessibility_features.has_captions && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Captions
                    </Badge>
                  )}
                  {processedData.accessibility_features.has_diarization && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <Users className="h-3 w-3 mr-1" />
                      Diarization
                    </Badge>
                  )}
                  {processedData.accessibility_features.has_word_timing && (
                    <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20">
                      <Subtitles className="h-3 w-3 mr-1" />
                      Word Timing
                    </Badge>
                  )}
                  {processedData.accessibility_features.simplified_available && (
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Simplified
                    </Badge>
                  )}
                </div>
              )}

              {/* Download Options */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadVTT}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Captions (VTT)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full Transcript */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-500" />
                  {showSimplified ? "Simplified Transcript" : "Full Transcript"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(
                    showSimplified 
                      ? processedData.simplified_transcript 
                      : processedData.full_transcript,
                    "transcript"
                  )}
                >
                  {copiedField === "transcript" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto p-4 bg-secondary rounded-lg">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {showSimplified 
                    ? processedData.simplified_transcript 
                    : processedData.full_transcript}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Speaker Segments */}
          {processedData.speaker_segments && processedData.speaker_segments.length > 0 && (
            <Card className="md:col-span-2 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" />
                  Speaker Timeline
                </CardTitle>
                <CardDescription>
                  Click on a segment to jump to that point in the video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {processedData.speaker_segments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = segment.start
                        }
                      }}
                    >
                      <Badge 
                        variant="outline"
                        className={`shrink-0 ${
                          segment.speaker === "A" 
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                            : segment.speaker === "B"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-violet-500/10 text-violet-600 border-violet-500/20"
                        }`}
                      >
                        Speaker {segment.speaker}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">
                          {segment.text}
                        </p>
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

      {/* No Video Data Message */}
      {!videoUrl && !processedData && !isProcessing && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Upload a video to see real-time captions with speaker diarization.
          </p>
        </div>
      )}
    </div>
  )
}
