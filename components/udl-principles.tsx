import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Eye, Heart } from "lucide-react"

const principles = [
  {
    icon: Eye,
    title: "Multiple Means of Representation",
    description:
      "Present information in various formats—text, audio, video, and images—to accommodate different learning preferences and abilities.",
    examples: ["Text-to-speech", "Visual aids", "Multilingual support", "Simplified language"],
  },
  {
    icon: Brain,
    title: "Multiple Means of Action & Expression",
    description:
      "Provide learners with alternatives for demonstrating what they know through diverse methods and tools.",
    examples: ["Voice input", "Written responses", "Visual presentations", "Interactive tools"],
  },
  {
    icon: Heart,
    title: "Multiple Means of Engagement",
    description:
      "Tap into learners' interests by offering choices in how they engage with content and express their understanding.",
    examples: ["Personalized content", "Goal setting", "Feedback systems", "Collaborative options"],
  },
]

export function UdlPrinciples() {
  return (
    <section id="principles" className="py-20 bg-card/50" aria-labelledby="principles-heading">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="principles-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Three UDL Principles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Universal Design for Learning provides a framework for creating flexible learning experiences that
            accommodate individual differences.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {principles.map((principle) => (
            <Card key={principle.title} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <principle.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl text-foreground">{principle.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {principle.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" aria-label={`Examples of ${principle.title}`}>
                  {principle.examples.map((example) => (
                    <li key={example} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                      {example}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
