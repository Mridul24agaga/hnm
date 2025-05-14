import type { ReactNode } from "react"

interface SopsLayoutProps {
  children: ReactNode
}

export default function SopsLayout({ children }: SopsLayoutProps) {
  return <div className="min-h-screen bg-white">{children}</div>
}
