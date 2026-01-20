import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden" aria-labelledby="hero-heading">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
        aria-hidden="true"
      />

      <div className="container relative px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">AI-Powered Accessibility</span>
          </div>

          <h1
            id="hero-heading"
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance"
          >
            Universal Design for <span className="text-primary">Learning</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty leading-relaxed">
            Transform your content into accessible formats with AI. Our platform simplifies text, generates
            translations, creates alt text, and ensures WCAG compliance—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link href="/upload">
                Get Started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#principles">Learn About UDL</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border w-full">
            {[
              { value: "7+", label: "AI Models" },
              { value: "40+", label: "Languages" },
              { value: "WCAG 2.1", label: "Compliant" },
              { value: "100%", label: "Accessible" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
