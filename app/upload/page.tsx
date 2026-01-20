import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { UploadForm } from "@/components/upload-form"

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Upload Your Content</h1>
              <p className="text-lg text-muted-foreground">
                Choose your input method and let our AI transform your content into accessible formats.
              </p>
            </div>
            <UploadForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
