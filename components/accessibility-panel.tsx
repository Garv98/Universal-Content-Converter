"use client"

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Type,
  Sun,
  Moon,
  BookOpen,
  Minus,
  Plus,
  Contrast,
  Palette,
  Volume2,
  VolumeX,
  Settings2,
  Focus,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// Accessibility Context for global state
interface AccessibilitySettings {
  dyslexiaMode: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  lineSpacing: number
  letterSpacing: number
  readingGuide: boolean
  focusMode: boolean
  highContrast: boolean
  reducedMotion: boolean
  textSelectionReader: boolean
  darkMode: boolean
}

const defaultSettings: AccessibilitySettings = {
  dyslexiaMode: false,
  colorBlindMode: 'none',
  lineSpacing: 150,
  letterSpacing: 0,
  readingGuide: false,
  focusMode: false,
  highContrast: false,
  reducedMotion: false,
  textSelectionReader: true,
  darkMode: true,
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void
  resetSettings: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider")
  }
  return context
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('udl-accessibility-settings')
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) })
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const body = document.body

    root.style.setProperty('--udl-line-height', `${settings.lineSpacing / 100}`)
    
    root.style.setProperty('--udl-letter-spacing', `${settings.letterSpacing}em`)

    if (settings.dyslexiaMode) {
      body.classList.add('dyslexia-mode')
    } else {
      body.classList.remove('dyslexia-mode')
    }

    root.removeAttribute('data-color-blind')
    if (settings.colorBlindMode !== 'none') {
      root.setAttribute('data-color-blind', settings.colorBlindMode)
    }

    if (settings.highContrast) {
      body.classList.add('high-contrast')
    } else {
      body.classList.remove('high-contrast')
    }

    if (settings.reducedMotion) {
      body.classList.add('reduced-motion')
    } else {
      body.classList.remove('reduced-motion')
    }

    if (settings.focusMode) {
      body.classList.add('focus-mode')
    } else {
      body.classList.remove('focus-mode')
    }

    if (settings.darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    if (settings.readingGuide) {
      body.classList.add('reading-guide')
    } else {
      body.classList.remove('reading-guide')
    }

    localStorage.setItem('udl-accessibility-settings', JSON.stringify(settings))
  }, [settings, mounted])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('udl-accessibility-settings')
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function AccessibilityPanel() {
  const { settings, updateSetting, resetSettings } = useAccessibility()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] accessibility-panel-fixed">
      {/* Main Toggle Button */}
      <div className="relative">
        {/* Active indicator badge */}
        {Object.values(settings).some(val => val === true || (typeof val === 'string' && val !== 'none')) && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" 
               title="Accessibility features active" />
        )}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Accessibility settings"
          aria-expanded={isExpanded}
        >
          <Settings2 className="h-6 w-6" />
        </Button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <Card className="absolute bottom-16 right-0 w-80 max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Accessibility
            </CardTitle>
            {/* Active features indicator */}
            {Object.entries(settings).filter(([key, value]) => 
              value === true || (key === 'colorBlindMode' && value !== 'none')
            ).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {settings.dyslexiaMode && <Badge variant="secondary" className="text-xs">Dyslexia</Badge>}
                {settings.highContrast && <Badge variant="secondary" className="text-xs">High Contrast</Badge>}
                {settings.focusMode && <Badge variant="secondary" className="text-xs">Focus</Badge>}
                {settings.readingGuide && <Badge variant="secondary" className="text-xs">Reading Line</Badge>}
                {settings.reducedMotion && <Badge variant="secondary" className="text-xs">Calm Mode</Badge>}
                {settings.textSelectionReader && <Badge variant="secondary" className="text-xs">Text Reader</Badge>}
                {settings.colorBlindMode !== 'none' && <Badge variant="secondary" className="text-xs">{settings.colorBlindMode}</Badge>}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Quick Toggles */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.dyslexiaMode ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('dyslexiaMode', !settings.dyslexiaMode)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.dyslexiaMode}
                title="Use OpenDyslexic font with extra spacing"
              >
                <Type className="h-4 w-4" />
                <span className="text-xs">Dyslexia</span>
              </Button>
              <Button
                variant={settings.highContrast ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.highContrast}
                title="Increase contrast for better visibility"
              >
                <Contrast className="h-4 w-4" />
                <span className="text-xs">Contrast</span>
              </Button>
              <Button
                variant={settings.focusMode ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('focusMode', !settings.focusMode)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.focusMode}
                title="Hide distractions, center main content"
              >
                <Focus className="h-4 w-4" />
                <span className="text-xs">Focus</span>
              </Button>
              <Button
                variant={settings.readingGuide ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('readingGuide', !settings.readingGuide)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.readingGuide}
                title="Minimal ruler that follows your mouse to help track lines while reading"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">Read Line</span>
              </Button>
              <Button
                variant={settings.reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.reducedMotion}
                title="Gentle slow transitions instead of jarring animations (helps with motion sensitivity)"
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs">Calm Mode</span>
              </Button>
              <Button
                variant={settings.darkMode ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('darkMode', !settings.darkMode)}
                className="flex-col h-16 gap-1"
                aria-pressed={settings.darkMode}
                title={settings.darkMode ? "Switch to light theme" : "Switch to dark theme"}
              >
                {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-xs">{settings.darkMode ? 'Dark' : 'Light'}</span>
              </Button>
            </div>

            {/* Line Spacing */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleSection('line')}
                className="flex items-center justify-between w-full text-sm font-medium"
                aria-expanded={activeSection === 'line'}
              >
                <span>Line Spacing: {settings.lineSpacing}%</span>
                {activeSection === 'line' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeSection === 'line' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSetting('lineSpacing', Math.max(100, settings.lineSpacing - 25))}
                    aria-label="Decrease line spacing"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="25"
                    value={settings.lineSpacing}
                    onChange={(e) => updateSetting('lineSpacing', parseInt(e.target.value))}
                    className="flex-1"
                    aria-label="Line spacing slider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSetting('lineSpacing', Math.min(300, settings.lineSpacing + 25))}
                    aria-label="Increase line spacing"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleSection('letter')}
                className="flex items-center justify-between w-full text-sm font-medium"
                aria-expanded={activeSection === 'letter'}
              >
                <span>Letter Spacing: {settings.letterSpacing.toFixed(1)}em</span>
                {activeSection === 'letter' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeSection === 'letter' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSetting('letterSpacing', Math.max(0, settings.letterSpacing - 0.05))}
                    aria-label="Decrease letter spacing"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={settings.letterSpacing}
                    onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value))}
                    className="flex-1"
                    aria-label="Letter spacing slider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateSetting('letterSpacing', Math.min(0.5, settings.letterSpacing + 0.05))}
                    aria-label="Increase letter spacing"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Color Blind Mode */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleSection('colorblind')}
                className="flex items-center justify-between w-full text-sm font-medium"
                aria-expanded={activeSection === 'colorblind'}
              >
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Color Vision
                </span>
                {activeSection === 'colorblind' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeSection === 'colorblind' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={settings.colorBlindMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('colorBlindMode', mode)}
                      className="text-xs"
                    >
                      {mode === 'none' ? 'Normal' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Selection Reader */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Volume2 className="h-4 w-4" /> Read Selected Text
              </span>
              <Button
                variant={settings.textSelectionReader ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('textSelectionReader', !settings.textSelectionReader)}
                aria-pressed={settings.textSelectionReader}
                title="Show 'Read Aloud' button when you select text"
              >
                {settings.textSelectionReader ? 'On' : 'Off'}
              </Button>
            </div>

            {/* Reset Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="w-full text-muted-foreground"
            >
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TextSelectionReader() {
  const { settings } = useAccessibility()
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showButton, setShowButton] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (!settings.textSelectionReader) {
      setShowButton(false)
      return
    }

    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0) {
        setSelectedText(text)
        
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()
        
        if (rect) {
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 50
          })
          setShowButton(true)
        }
      } else {
        setShowButton(false)
      }
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('touchend', handleSelection)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('keyup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [settings.textSelectionReader])

  const speakSelection = () => {
    if ('speechSynthesis' in window && selectedText) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(selectedText)
      utterance.rate = 0.85
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        setShowButton(false)
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setShowButton(false)
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  if (!showButton) return null

  return (
    <div
      className="fixed z-[10000] animate-in fade-in zoom-in duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <Button
        onClick={isSpeaking ? stopSpeaking : speakSelection}
        size="sm"
        className="shadow-lg bg-primary hover:bg-primary/90 gap-2"
        title={isSpeaking ? "Stop reading" : "Read selected text aloud"}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="h-4 w-4" />
            <span className="text-xs">Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            <span className="text-xs">Read Aloud</span>
          </>
        )}
      </Button>
    </div>
  )
}

export function ReadingGuide() {
  const { settings } = useAccessibility()
  const [position, setPosition] = useState(0)

  useEffect(() => {
    if (!settings.readingGuide) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [settings.readingGuide])

  if (!settings.readingGuide) return null

  const barStyle = {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    top: position - 25,
    height: '50px',
    pointerEvents: 'none' as const,
    zIndex: 9999,
    transition: 'top 0.05s linear'
  }

  return (
    <div style={barStyle}>
      {/* Semi-transparent background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(114, 206, 206, 0.15)',
        borderTop: '2px solid rgba(114, 206, 206, 0.4)',
        borderBottom: '2px solid rgba(114, 206, 206, 0.4)'
      }} />
      
      {/* Bold center line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: 'rgb(114, 206, 206)',
        boxShadow: '0 0 10px rgba(114, 206, 206, 0.6)',
        transform: 'translateY(-50%)'
      }} />
    </div>
  )
}

export function CognitiveLoadIndicator({ text }: { text: string }) {
  const calculateLoad = (text: string): { level: 'low' | 'medium' | 'high', score: number, details: string } => {
    if (!text) return { level: 'low', score: 0, details: 'No content' }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    const words = text.split(/\s+/).filter(w => w.trim())
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length || 0
    const avgSentenceLength = words.length / sentences.length || 0
    
    const complexWords = words.filter(w => w.length > 6).length
    const complexWordRatio = complexWords / words.length

    const score = Math.min(100, Math.round(
      (avgWordLength * 5) + 
      (avgSentenceLength * 2) + 
      (complexWordRatio * 50)
    ))

    let level: 'low' | 'medium' | 'high' = 'low'
    let details = ''

    if (score < 30) {
      level = 'low'
      details = 'Easy to read - suitable for all audiences'
    } else if (score < 60) {
      level = 'medium'
      details = 'Moderate complexity - may need simplification'
    } else {
      level = 'high'
      details = 'Complex - consider using text simplification'
    }

    return { level, score, details }
  }

  const { level, score, details } = calculateLoad(text)

  const colors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  }

  const emojis = {
    low: '✅',
    medium: '⚠️',
    high: '❌',
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <div className="text-2xl" aria-hidden="true">{emojis[level]}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Cognitive Load</span>
          <span className="text-xs text-muted-foreground">{score}/100</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${colors[level]} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{details}</p>
      </div>
    </div>
  )
}

export function ExportAccessibleFormats({ content }: { 
  content: { 
    original: string
    simplified: string
    translations?: Record<string, { text: string; native_name: string; language_code: string; audio?: string }>
  } 
}) {
  const [exporting, setExporting] = useState(false)

  const exportAs = async (format: 'txt' | 'html' | 'rtf') => {
    setExporting(true)
    
    try {
      let blob: Blob
      let filename: string

      switch (format) {
        case 'txt':
          const txtContent = `ACCESSIBLE CONTENT EXPORT
========================

ORIGINAL TEXT:
${content.original}

SIMPLIFIED VERSION:
${content.simplified}

${content.translations ? `TRANSLATIONS:
${Object.entries(content.translations).map(([lang, trans]) => `\n${trans.native_name || lang}:\n${trans.text}`).join('\n')}` : ''}`
          
          blob = new Blob([txtContent], { type: 'text/plain' })
          filename = 'accessible-content.txt'
          break

        case 'html':
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Content</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap');
    body {
      font-family: 'OpenDyslexic', Arial, sans-serif;
      font-size: 18px;
      line-height: 1.8;
      letter-spacing: 0.05em;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #fafafa;
      color: #333;
    }
    h1, h2 { color: #2563eb; }
    .original { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .simplified { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .translation { background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Accessible Content</h1>
  
  <h2>Original Text</h2>
  <div class="original" aria-label="Original text">
    <p>${content.original}</p>
  </div>
  
  <h2>Simplified Version</h2>
  <div class="simplified" aria-label="Simplified text">
    <p>${content.simplified}</p>
  </div>
  
  ${content.translations ? `
  <h2>Translations</h2>
  ${Object.entries(content.translations).map(([lang, trans]) => `
  <div class="translation" lang="${trans.language_code}">
    <h3>${trans.native_name || lang}</h3>
    <p>${trans.text}</p>
  </div>
  `).join('')}
  ` : ''}
</body>
</html>`
          
          blob = new Blob([htmlContent], { type: 'text/html' })
          filename = 'accessible-content.html'
          break

        case 'rtf':
          const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}}
{\\colortbl;\\red0\\green0\\blue0;\\red37\\green99\\blue235;}
\\viewkind4\\uc1\\pard\\fs28\\b\\cf2 Accessible Content\\b0\\cf1\\fs22\\par
\\par
\\b ORIGINAL TEXT:\\b0\\par
${content.original.replace(/\n/g, '\\par ')}\\par
\\par
\\b SIMPLIFIED VERSION:\\b0\\par
${content.simplified.replace(/\n/g, '\\par ')}\\par
}`
          
          blob = new Blob([rtfContent], { type: 'application/rtf' })
          filename = 'accessible-content.rtf'
          break

        default:
          return
      }

      //Download file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportAs('txt')}
        disabled={exporting}
      >
        📄 Export TXT
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportAs('html')}
        disabled={exporting}
      >
        🌐 Export HTML
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportAs('rtf')}
        disabled={exporting}
      >
        📝 Export RTF
      </Button>
    </div>
  )
}
