import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SignUpForm } from "@/components/sign-up-form"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <SignUpForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
