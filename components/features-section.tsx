import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Languages, ImageIcon, Mic, Shield, CheckCircle, Hand, BarChart } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Text Simplification",
    description: "Automatically simplify complex text to improve readability for diverse audiences.",
  },
  {
    icon: Languages,
    title: "Multi-Language Translation",
    description: "Translate content into 40+ languages while preserving meaning and context.",
  },
  {
    icon: ImageIcon,
    title: "Alt Text Generation",
    description: "AI-powered image descriptions for screen readers and accessibility compliance.",
  },
  {
    icon: Mic,
    title: "Audio Transcription",
    description: "Convert speech to text with high accuracy for audio and video content.",
  },
  {
    icon: BarChart,
    title: "Semantic Similarity",
    description: "Measure how well simplified content preserves the original meaning.",
  },
  {
    icon: Shield,
    title: "Bias Detection",
    description: "Identify and flag potentially biased language in your content.",
  },
  {
    icon: CheckCircle,
    title: "WCAG Compliance",
    description: "Automated checking against Web Content Accessibility Guidelines.",
  },
  {
    icon: Hand,
    title: "Sign Language Support",
    description: "Generate sign language gloss representations for deaf accessibility.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20" aria-labelledby="features-heading">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful AI Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform combines multiple AI models to transform your content into accessible formats.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card border-border hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <feature.icon
                    className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle className="text-base text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
