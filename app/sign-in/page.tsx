import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SignInForm } from "@/components/sign-in-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <SignInForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
