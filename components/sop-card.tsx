import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, ExternalLink, Smartphone, Globe } from "lucide-react"

interface Sop {
  id: string
  title: string
  description: string
  video_url: string
  completed: boolean
  type: "mobile" | "web"
  platform: string
}

interface SopCardProps {
  sop: Sop
}

export function SopCard({ sop }: SopCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-md">
      <CardHeader className="p-4 pb-0 flex flex-row justify-between items-start">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {sop.type === "mobile" ? (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
              >
                <Smartphone className="h-3 w-3" />
                Mobile App
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                Web App
              </Badge>
            )}
            {sop.completed && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg text-black line-clamp-2">{sop.title}</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-gray-600 line-clamp-3">{sop.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Link href={sop.video_url} className="w-full">
          <Button variant="default" className="w-full bg-[#00a2ff] hover:bg-[#0082cc] text-white">
            View SOP
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
