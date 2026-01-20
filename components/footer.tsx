import { Accessibility } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-8 bg-card/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Universal UDL Converter</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UDL Converter. Built for accessible learning.
          </p>
        </div>
      </div>
    </footer>
  )
}
