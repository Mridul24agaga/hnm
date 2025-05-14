"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Search, ArrowUpDown, Loader2, Video, Play, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

// User with video progress
interface UserVideoProgress {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  sop_id: string
  sop_title: string
  progress_percentage: number
  video_position: number
  duration: number
  last_updated: string
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videoProgress, setVideoProgress] = useState<UserVideoProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      setRefreshing(true)
      console.log("Fetching video progress data...")

      // Fetch all video progress data
      const { data: videoProgressData, error: videoProgressError } = await supabase
        .from("sop_video_progress")
        .select("*")

      if (videoProgressError) {
        console.error("Error fetching video progress:", videoProgressError)
        return
      }

      console.log(`Fetched ${videoProgressData?.length || 0} video progress records`)

      // Fetch profiles for user info
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*")

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      }

      // Fetch SOPs for titles
      const { data: sops, error: sopsError } = await supabase.from("sops").select("*")

      if (sopsError) {
        console.error("Error fetching SOPs:", sopsError)
      }

      // Process video progress data
      const processedVideoProgress: UserVideoProgress[] = []

      if (videoProgressData && videoProgressData.length > 0) {
        for (const progress of videoProgressData) {
          const user = profiles?.find((p) => p.id === progress.user_id) || {
            id: progress.user_id,
            full_name: "Unknown User",
            email: "unknown@example.com",
            avatar_url: null,
          }

          const sop = sops?.find((s) => s.id === progress.sop_id) || {
            id: progress.sop_id,
            title: progress.sop_id,
          }

          processedVideoProgress.push({
            id: progress.id,
            full_name: user.full_name,
            email: user.email,
            avatar_url: user.avatar_url,
            sop_id: progress.sop_id,
            sop_title: sop.title || progress.sop_id,
            progress_percentage: progress.progress_percentage,
            video_position: progress.video_position,
            duration: progress.duration,
            last_updated: progress.last_updated,
          })
        }
      }

      setVideoProgress(processedVideoProgress)
      console.log(`Processed ${processedVideoProgress.length} video progress records`)

      // Update last refreshed time
      setLastRefreshed(new Date())
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscription for video progress updates
    const videoProgressSubscription = supabase
      .channel("video-progress-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sop_video_progress",
        },
        (payload) => {
          console.log("Real-time update received:", payload)
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(videoProgressSubscription)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const filteredVideoProgress = videoProgress.filter(
    (progress) =>
      progress.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.sop_title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-[#0099ff]" />
            Admin Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor user activity and SOP completion status
            <span className="ml-2 text-xs text-gray-500">
              Last refreshed: {formatDate(lastRefreshed.toISOString())}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users or SOPs..."
              className="pl-9 h-10 border-gray-200 bg-white text-black focus-visible:ring-[#0099ff]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-gray-200"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-medium text-black flex items-center gap-2">
            <Video className="h-5 w-5 text-[#0099ff]" />
            Video Progress Tracking
          </CardTitle>
          <CardDescription>Monitor user video viewing progress in real-time</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0099ff]" />
              <p className="mt-4">Loading video progress data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button variant="ghost" className="p-0 h-auto font-medium text-black hover:text-black">
                      User
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>SOP</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Watch Time</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideoProgress.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchQuery ? "No video progress data matches your search" : "No video progress data found"}
                      <div className="mt-4">
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="mx-auto">
                          {refreshing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Data
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVideoProgress.map((progress) => (
                    <TableRow key={progress.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarImage src={progress.avatar_url || undefined} alt={progress.full_name} />
                            <AvatarFallback className="bg-blue-50 text-[#0099ff] text-xs">
                              {getInitials(progress.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-black">{progress.full_name}</div>
                            <div className="text-xs text-gray-500">{progress.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{progress.sop_title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 w-full justify-between mb-1">
                            <span className="text-sm font-medium">{progress.progress_percentage}%</span>
                            {progress.progress_percentage >= 95 ? (
                              <Badge className="bg-green-50 text-green-700 border-0">Completed</Badge>
                            ) : progress.progress_percentage > 0 ? (
                              <Badge className="bg-blue-50 text-[#0099ff] border-0">In Progress</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 border-0">Not Started</Badge>
                            )}
                          </div>
                          <Progress value={progress.progress_percentage} className="h-2 w-full" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Play className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-700">
                            {formatTime(progress.video_position)} / {formatTime(progress.duration)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {formatDate(progress.last_updated)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
