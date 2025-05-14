import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 text-center">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-blue-800">Happy Home CRM</h1>
          <p className="text-lg text-gray-600">Manage your standard operating procedures efficiently</p>
        </div>

        <div className="flex flex-col space-y-4 pt-6">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
