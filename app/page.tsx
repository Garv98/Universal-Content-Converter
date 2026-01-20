import { Navbar } from "@/components/navbar"
import { LandingHero } from "@/components/landing-hero"
import { UdlPrinciples } from "@/components/udl-principles"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LandingHero />
        <UdlPrinciples />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}
