import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProcessingPipeline } from "@/components/processing-pipeline"

export default function ProcessingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Processing Your Content</h1>
              <p className="text-lg text-muted-foreground">
                Our AI pipeline is transforming your content into accessible formats.
              </p>
            </div>
            <ProcessingPipeline />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
