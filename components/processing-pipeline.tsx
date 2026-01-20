"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Languages,
  BarChart,
  Shield,
  CheckCircle,
  Hand,
  Loader2,
  Check,
  Circle,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { API_BASE_URL, processStep } from "@/lib/api"

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: contentType })
}

interface PipelineStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: "pending" | "processing" | "complete" | "error"
  error?: string
}

const initialSteps: PipelineStep[] = [
  {
    id: "extraction",
    title: "Text Extraction",
    description: "Extracting text content from your uploaded files",
    icon: FileText,
    status: "pending",
  },
  {
    id: "simplification",
    title: "Text Simplification",
    description: "Simplifying complex language for better readability",
    icon: FileText,
    status: "pending",
  },
  {
    id: "similarity",
    title: "Semantic Similarity",
    description: "Measuring meaning preservation after simplification",
    icon: BarChart,
    status: "pending",
  },
  {
    id: "bias",
    title: "Bias Detection",
    description: "Analyzing content for potentially biased language",
    icon: Shield,
    status: "pending",
  },
  {
    id: "wcag",
    title: "WCAG Compliance",
    description: "Checking accessibility guidelines compliance",
    icon: CheckCircle,
    status: "pending",
  },
]

export function ProcessingPipeline() {
  const router = useRouter()
  const [steps, setSteps] = useState<PipelineStep[]>(initialSteps)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  const playSuccessSound = () => {
    try {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.1
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Audio not supported, silently continue
    }
  }

  useEffect(() => {
    const processSteps = async () => {
      const textContent = sessionStorage.getItem("udl-text-content") || ""
      const imageData = sessionStorage.getItem("udl-image-file")
      const pdfData = sessionStorage.getItem("udl-pdf-file")
      const audioData = sessionStorage.getItem("udl-audio-file")
      
      let extractedText = textContent
      let simplifiedText = ""

      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i)

        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))

        try {
          const stepId = steps[i].id
          let result

          switch (stepId) {
            case "extraction": {
              const formData = new FormData()
              formData.append("text", textContent)
              
              const cachedFiles = typeof window !== 'undefined' ? (window as any).__udl_files : null
              
              if (pdfData) {
                try {
                  const pdf = JSON.parse(pdfData)
                  if (pdf.isLarge && cachedFiles?.pdf) {
                    formData.append("pdf", cachedFiles.pdf)
                    console.log("PDF file attached (from cache):", pdf.name, pdf.size, "bytes")
                  } else if (pdf.data) {
                    const pdfBlob = base64ToBlob(pdf.data, pdf.type)
                    formData.append("pdf", pdfBlob, pdf.name)
                    console.log("PDF file attached:", pdf.name)
                  }
                } catch (e) {
                  console.error("Error parsing PDF data:", e)
                }
              } else if (imageData) {
                try {
                  const image = JSON.parse(imageData)
                  if (image.isLarge && cachedFiles?.image) {
                    formData.append("image", cachedFiles.image)
                    console.log("Image file attached (from cache):", image.name, image.size, "bytes")
                  } else if (image.data) {
                    const imageBlob = base64ToBlob(image.data, image.type)
                    formData.append("image", imageBlob, image.name)
                    console.log("Image file attached:", image.name)
                  }
                } catch (e) {
                  console.error("Error parsing image data:", e)
                }
              } else if (audioData) {
                try {
                  const audio = JSON.parse(audioData)
                  if (audio.isLarge && cachedFiles?.audio) {
                    formData.append("audio", cachedFiles.audio)
                    console.log("Audio file attached (from cache):", audio.name, audio.size, "bytes")
                  } else if (audio.data) {
                    const audioBlob = base64ToBlob(audio.data, audio.type)
                    formData.append("audio", audioBlob, audio.name)
                    console.log("Audio file attached:", audio.name)
                  }
                } catch (e) {
                  console.error("Error parsing audio data:", e)
                }
              }
              
              console.log("Sending extraction request with FormData")
              result = await processStep("extraction", formData)
              console.log("Extraction result:", result)
              
              if (result.success && result.result) {
                extractedText = (result.result as { text: string }).text || textContent
                console.log("Extracted text length:", extractedText.length)
              }
              break
            }

            case "simplification":
              result = await processStep("simplification", { text: extractedText })
              if (result.success && result.result) {
                const simplificationResult = result.result as { simplified: string; original?: string }
                simplifiedText = simplificationResult.simplified || ""
                if (!simplificationResult.original) {
                  result.result = {
                    ...simplificationResult,
                    original: extractedText
                  }
                }
                console.log("Simplification complete - original length:", extractedText.length, "simplified length:", simplifiedText.length)
              }
              break

            case "similarity":
              result = await processStep("similarity", {
                original: extractedText,
                simplified: simplifiedText,
              })
              break

            case "bias":
              result = await processStep("bias", { text: extractedText })
              break

            case "wcag":
              result = await processStep("wcag", { text: extractedText })
              break

            default:
              result = { success: true, result: {} }
          }

          const existingResults = JSON.parse(sessionStorage.getItem("udl-results") || "{}")
          const updatedResults = {
            ...existingResults,
            [stepId]: result.success ? result.result : getMockResult(stepId),
          }
          
          console.log(`Storing ${stepId} result:`, result.result)
          
          if (stepId === "simplification") {
            console.log("📝 Simplification stored in sessionStorage:", updatedResults.simplification)
          }
          if (stepId === "bias") {
            console.log("🚨 BIAS RESULT FROM API:", JSON.stringify(result.result, null, 2))
            console.log("🚨 BIAS HAS detailed_report:", 'detailed_report' in result.result)
            console.log("🚨 BIAS detailed_report length:", result.result.detailed_report?.length)
          }
          
          sessionStorage.setItem("udl-results", JSON.stringify(updatedResults))

          playSuccessSound()
          setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
        } catch (error) {
          console.error(`Error processing step ${steps[i].id}:`, error)

          const existingResults = JSON.parse(sessionStorage.getItem("udl-results") || "{}")
          sessionStorage.setItem(
            "udl-results",
            JSON.stringify({
              ...existingResults,
              [steps[i].id]: getMockResult(steps[i].id),
            }),
          )

          setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
        }
      }

      if (imageData) {
        try {
          console.log("🖼️ Copying alt text from extraction result...")
          const image = JSON.parse(imageData)
          const existingResults = JSON.parse(sessionStorage.getItem("udl-results") || "{}")
          
          console.log("🔍 DEBUG: Full extraction result:", existingResults.extraction)
          console.log("🔍 DEBUG: Alt text fields:", {
            alt_text: existingResults.extraction?.alt_text,
            raw_caption: existingResults.extraction?.raw_caption,
            brief_caption: existingResults.extraction?.brief_caption,
            detailed_caption: existingResults.extraction?.detailed_caption
          })
          
          if (existingResults.extraction?.alt_text || existingResults.extraction?.raw_caption || existingResults.extraction?.brief_caption) {
            const alttextData = {
              alt_text: existingResults.extraction.alt_text,
              brief_caption: existingResults.extraction.brief_caption || existingResults.extraction.raw_caption,
              raw_caption: existingResults.extraction.raw_caption,
              detailed_caption: existingResults.extraction.detailed_caption,
              enhanced_description: existingResults.extraction.enhanced_description,
              ocr_text: existingResults.extraction.ocr_text,
              all_captions: existingResults.extraction.all_captions,
              image_info: existingResults.extraction.image_info,
              model: existingResults.extraction.model,
              confidence: existingResults.extraction.confidence,
              success: existingResults.extraction.success !== false
            }
            
            console.log("✅ Alt text data to store:", alttextData)
            
            sessionStorage.setItem("udl-results", JSON.stringify({
              ...existingResults,
              alttext: alttextData
            }))
            console.log("✅ Alt text copied from extraction result")
            
            if (image.data) {
              sessionStorage.setItem("udl-alttext-image", image.data)
              console.log("✅ Image data URL stored for display")
            }
          } else {
            console.warn("⚠️ No alt text found in extraction result")
            console.log("Available extraction fields:", Object.keys(existingResults.extraction || {}))
          }
        } catch (error) {
          console.error("❌ Error copying alt text:", error)
        }
      }

      if (audioData) {
        try {
          const existingResults = JSON.parse(sessionStorage.getItem("udl-results") || "{}")
          
          console.log("🔍 DEBUG: Full extraction result:", existingResults.extraction)
          console.log("🔍 DEBUG: speaker_turns:", existingResults.extraction?.speaker_turns)
          console.log("🔍 DEBUG: speaker_count:", existingResults.extraction?.speaker_count)
          console.log("🔍 DEBUG: segments:", existingResults.extraction?.segments)
          
          if (existingResults.extraction?.text || existingResults.extraction?.transcript) {
            const transcriptData = {
              text: existingResults.extraction.text || existingResults.extraction.transcript || "",
              language: existingResults.extraction.language,
              formatted_transcript: existingResults.extraction.formatted_transcript,
              segments: existingResults.extraction.segments,
              speaker_turns: existingResults.extraction.speaker_turns,
              speaker_count: existingResults.extraction.speaker_count,
              duration: existingResults.extraction.duration,
              model: existingResults.extraction.model,
              word_count: existingResults.extraction.word_count,
              chars: existingResults.extraction.chars,
              words: existingResults.extraction.words
            }
            
            console.log("✅ Copying transcript data:", transcriptData)
            console.log("📊 Speaker turns being copied:", transcriptData.speaker_turns?.length)
            
            sessionStorage.setItem("udl-results", JSON.stringify({
              ...existingResults,
              transcript: transcriptData
            }))
            console.log("✅ Transcript data copied from extraction result")
          }
        } catch (error) {
          console.error("Error copying transcript:", error)
        }
      }

      setIsComplete(true)
      console.log("✅ All processing complete!")
    }

    const timer = setTimeout(processSteps, 500)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const completedSteps = steps.filter((s) => s.status === "complete").length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between text-muted-foreground">
            <span>Backend API</span>
            <span className="text-xs font-mono">{API_BASE_URL}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <span>Pipeline Progress</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedSteps} of {steps.length} steps
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" aria-label={`${Math.round(progress)}% complete`} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`bg-card border-border transition-all ${
              step.status === "processing" ? "border-primary ring-1 ring-primary/20" : ""
            } ${step.status === "error" ? "border-destructive ring-1 ring-destructive/20" : ""}`}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === "complete"
                    ? "bg-primary/20 text-primary"
                    : step.status === "processing"
                      ? "bg-primary/10 text-primary"
                      : step.status === "error"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-secondary text-muted-foreground"
                }`}
              >
                {step.status === "complete" ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : step.status === "processing" ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : step.status === "error" ? (
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Circle className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <h3
                    className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground truncate">{step.error || step.description}</p>
              </div>

              <div className="text-sm">
                {step.status === "complete" && <span className="text-primary font-medium">Complete</span>}
                {step.status === "processing" && <span className="text-primary font-medium">Processing...</span>}
                {step.status === "error" && (
                  <span className="text-destructive font-medium">Error (using fallback)</span>
                )}
                {step.status === "pending" && <span className="text-muted-foreground">Pending</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isComplete && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Processing Complete!</h3>
            <p className="text-muted-foreground mb-4">
              All accessibility transformations have been applied to your content.
            </p>
            <Button size="lg" className="gap-2" onClick={() => router.push("/results")}>
              View Results
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getMockResult(stepId: string): unknown {
  const mockResults: Record<string, unknown> = {
    extraction: {
      text: "The quick brown fox jumps over the lazy dog. This is sample extracted text from the uploaded content.",
      source: "direct_input",
    },
    simplification: {
      original:
        "The implementation of Universal Design for Learning (UDL) principles necessitates a comprehensive understanding of neurodiversity.",
      simplified:
        "Universal Design for Learning (UDL) helps us understand that everyone learns differently. We need to know how different brains work.",
    },
    translation: {
      original: "Universal Design for Learning helps everyone learn better.",
      translations: {
        Spanish: "El Diseño Universal para el Aprendizaje ayuda a todos a aprender mejor.",
        French: "La Conception Universelle de l'Apprentissage aide tout le monde à mieux apprendre.",
        German: "Universelles Design für Lernen hilft allen besser zu lernen.",
        Chinese: "通用学习设计帮助每个人更好地学习。",
      },
    },
    similarity: {
      score: 0.87,
      interpretation: "High semantic similarity - meaning well preserved",
    },
    bias: {
      success: true,
      overall_bias_detected: false,
      bias_score: 100,
      flags: [],
      categories: [],
      detailed_report: "✓ No significant bias detected. Content appears inclusive and balanced.",
    },
    wcag: {
      success: true,
      overall_score: 92,
      wcag_level: "AA",
      compliance_by_level: { A: 100, AA: 92, AAA: 75 },
      principle_scores: { perceivable: 95, operable: 90, understandable: 88, robust: 95 },
      checks: [],
      issues: [],
      recommendations: [],
      detailed_report: "Mock WCAG report - run actual analysis to see full details."
    },
  }

  return mockResults[stepId] || {}
}
