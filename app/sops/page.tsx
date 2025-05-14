import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Smartphone, Globe } from "lucide-react"

export default function SopsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white">
      <h1 className="text-3xl font-bold text-black mb-6">Standard Operating Procedures</h1>
      <p className="text-gray-700 mb-8">
        Browse through our collection of Standard Operating Procedures (SOPs) to learn how to use GoHighLevel
        effectively.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/sops/mobile-app-sop-page" className="block">
          <Card className="h-full bg-white border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center border border-purple-200">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600">Mobile App</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How to Use GoHighLevel Mobile Application</h3>
              <p className="text-gray-600">
                Learn how to navigate and use the GoHighLevel mobile application for on-the-go CRM management.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="#" className="block">
          <Card className="h-full bg-white border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center border border-blue-200">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600">Web App</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How to Use GoHighLevel Web Application</h3>
              <p className="text-gray-600">
                Comprehensive guide to using the GoHighLevel web platform for maximum productivity.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="#" className="block">
          <Card className="h-full bg-white border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center border border-green-200">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600">Getting Started</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">GoHighLevel Onboarding Guide</h3>
              <p className="text-gray-600">
                Essential steps to get started with GoHighLevel and set up your account for success.
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
