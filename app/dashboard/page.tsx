"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SopCard } from "@/components/sop-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, FileText, Award, Search, Filter, Smartphone, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Sop {
  id: string
  title: string
  description: string
  video_url: string
  completed: boolean
  type: "mobile" | "web"
  platform: string
}

export default function DashboardPage() {
  const [sops, setSops] = useState<Sop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchSops = async () => {
      try {
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        // Fetch user's completed SOPs
        const { data: completions, error: completionsError } = await supabase
          .from("sop_completions")
          .select("sop_id")
          .eq("user_id", user.id)

        if (completionsError) throw completionsError

        // Create a set of completed SOP IDs for quick lookup
        const completedSopIds = new Set(completions?.map((c) => c.sop_id) || [])

        // Create GoHighLevel specific SOPs
        const goHighLevelSops = [
          {
            id: "web-app-usage",
            title: "How to Use GoHighLevel Web Application",
            description: "Comprehensive guide to using the GoHighLevel web platform for maximum productivity.",
            video_url: "/sops/web-app-usage",
            completed: completedSopIds.has("web-app-usage"),
            type: "web" as const,
            platform: "GoHighLevel",
          },
          {
            id: "mobile-app-usage",
            title: "How to Use GoHighLevel Mobile App",
            description:
              "Learn how to navigate and use the GoHighLevel mobile application for on-the-go CRM management.",
            video_url: "/sops/mobile-app-usage",
            completed: completedSopIds.has("mobile-app-usage"),
            type: "mobile" as const,
            platform: "GoHighLevel",
          },
        ]

        setSops(goHighLevelSops)
      } catch (error) {
        console.error("Error fetching SOPs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSops()
  }, [supabase])

  const completedCount = sops.filter((sop) => sop.completed).length
  const pendingCount = sops.length - completedCount
  const completionPercentage = sops.length > 0 ? Math.round((completedCount / sops.length) * 100) : 0

  // Count mobile and web SOPs
  const mobileSopsCount = sops.filter((sop) => sop.type === "mobile").length
  const webSopsCount = sops.filter((sop) => sop.type === "web").length

  const filteredSops = sops.filter(
    (sop) =>
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-[#00a2ff]" />
            GoHighLevel Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Welcome to GoHighLevel CRM. View and complete your required SOPs below.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search SOPs..."
              className="pl-9 h-10 border-gray-200 bg-white text-black focus-visible:ring-[#00a2ff]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 border-gray-200">
            <Filter className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-600">Total SOPs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#00a2ff]" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-black">{sops.length}</div>
            <p className="text-xs text-gray-500 mt-1">All standard operating procedures</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <Award className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-black">{completedCount}</div>
            <p className="text-xs text-gray-500 mt-1">SOPs you've successfully completed</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-600">Mobile App SOPs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-black">{mobileSopsCount}</div>
            <p className="text-xs text-gray-500 mt-1">Mobile application procedures</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-600">Web App SOPs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Globe className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-black">{webSopsCount}</div>
            <p className="text-xs text-gray-500 mt-1">Web platform procedures</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-medium text-black flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#00a2ff]" />
            GoHighLevel Mastery Progress
          </CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00a2ff] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading GoHighLevel SOPs...</p>
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-black flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#00a2ff]" />
              GoHighLevel Standard Operating Procedures
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-gray-100 p-1">
                <TabsTrigger
                  value="all"
                  className="text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  All SOPs
                </TabsTrigger>
                <TabsTrigger
                  value="mobile"
                  className="text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  Mobile App
                </TabsTrigger>
                <TabsTrigger
                  value="web"
                  className="text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  Web App
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  Completed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {filteredSops.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2">No SOPs found matching your search</p>
                    {searchQuery && (
                      <Button variant="outline" className="mt-4 border-gray-200" onClick={() => setSearchQuery("")}>
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSops.map((sop) => (
                      <SopCard key={sop.id} sop={sop} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mobile" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSops
                    .filter((sop) => sop.type === "mobile")
                    .map((sop) => (
                      <SopCard key={sop.id} sop={sop} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="web" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSops
                    .filter((sop) => sop.type === "web")
                    .map((sop) => (
                      <SopCard key={sop.id} sop={sop} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSops
                    .filter((sop) => sop.completed)
                    .map((sop) => (
                      <SopCard key={sop.id} sop={sop} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
