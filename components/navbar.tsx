"use client"

import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accessibility, Menu, User, LogOut, Video, ALargeSmall } from "lucide-react"

export function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Universal UDL Converter Home">
          <Accessibility className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold text-foreground hidden sm:inline">UDL Converter</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href="/upload"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Upload
          </Link>
          <Link
            href="/processing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Processing
          </Link>
          <Link
            href="/results"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Results
          </Link>
          <Link
            href="/video"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
           Video
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/">Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/upload">Upload</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/processing">Processing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/results">Results</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/video">Video
                </Link>
              </DropdownMenuItem>
              {!isAuthenticated && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sign-up">Sign Up</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
