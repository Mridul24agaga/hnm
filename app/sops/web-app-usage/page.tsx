"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, Globe, Video, Lock, AlertCircle, Play } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

export default function WebAppSopPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [completed, setCompleted] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastReportedTime, setLastReportedTime] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const supabase = createClientComponentClient()

  // Add a debug log function (still keeping the function for console logs)
  const addDebugLog = (message: string) => {
    console.log(message)
  }

  useEffect(() => {
    const checkUserAndCompletionStatus = async () => {
      try {
        addDebugLog("Checking user authentication...")

        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          addDebugLog(`Auth error: ${userError.message}`)
          throw userError
        }

        if (!user) {
          addDebugLog("No authenticated user found")
          router.push("/login")
          return
        }

        addDebugLog(`User authenticated: ${user.id}`)
        setUserId(user.id)

        // Check if this SOP is completed
        const { data: completionData, error: completionError } = await supabase
          .from("sop_completions")
          .select("*")
          .eq("sop_id", "web-app-usage")
          .eq("user_id", user.id)
          .single()

        if (completionError && completionError.code !== "PGRST116") {
          addDebugLog(`Completion check error: ${completionError.message}`)
        }

        if (completionData) {
          addDebugLog("SOP already completed")
          setCompleted(true)
        } else {
          addDebugLog("SOP not yet completed")
        }

        // Check if we have a video progress record
        const { data: progressData, error: progressError } = await supabase
          .from("sop_video_progress")
          .select("*")
          .eq("sop_id", "web-app-usage")
          .eq("user_id", user.id)
          .single()

        if (progressError && progressError.code !== "PGRST116") {
          addDebugLog(`Progress check error: ${progressError.message}`)
        }

        if (progressData) {
          addDebugLog(`Found existing progress: ${progressData.progress_percentage}%`)

          // If progress is >= 95%, consider it watched
          if (progressData.progress_percentage >= 95) {
            addDebugLog("Video already watched (progress >= 95%)")
            setVideoWatched(true)
          }

          // Set the last reported time to resume from where they left off
          setLastReportedTime(progressData.video_position)

          // If we have a video element, set its current time
          if (videoRef.current && videoLoaded) {
            addDebugLog(`Setting video position to ${progressData.video_position}s`)
            videoRef.current.currentTime = progressData.video_position
          }
        } else {
          addDebugLog("No existing video progress found")
        }
      } catch (error) {
        console.error("Error checking user and completion status:", error)
        addDebugLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    checkUserAndCompletionStatus()
  }, [supabase, router, videoLoaded])

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      addDebugLog(`Video metadata loaded, duration: ${duration.toFixed(1)}s`)
      setVideoDuration(duration)
      setVideoLoaded(true)

      // If we have a last reported time, set the video to that position
      if (lastReportedTime > 0 && videoRef.current) {
        addDebugLog(`Setting video position to last reported time: ${lastReportedTime.toFixed(1)}s`)
        videoRef.current.currentTime = lastReportedTime
      }
    }
  }

  // Handle video time update
  const handleTimeUpdate = async () => {
    if (!videoRef.current || !userId || isSaving) return

    const currentTime = videoRef.current.currentTime
    const duration = videoRef.current.duration
    const progressPercentage = Math.floor((currentTime / duration) * 100)

    // Update UI
    setVideoProgress(progressPercentage)

    // Only save progress every 5 seconds or if progress is near 100%
    const shouldSaveProgress = currentTime - lastReportedTime >= 5 || (progressPercentage >= 95 && !videoWatched)

    if (shouldSaveProgress) {
      try {
        setIsSaving(true)
        addDebugLog(`Saving progress: ${progressPercentage}% (${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`)

        // Create the data object
        const progressData = {
          user_id: userId,
          sop_id: "web-app-usage",
          video_position: currentTime,
          duration: duration,
          progress_percentage: progressPercentage,
          last_updated: new Date().toISOString(),
        }

        // Log the exact data we're trying to insert
        addDebugLog(`Updating data: ${JSON.stringify(progressData)}`)

        // Insert or update the progress record with proper onConflict handling
        const { data, error } = await supabase.from("sop_video_progress").upsert(progressData, {
          onConflict: "user_id,sop_id",
          ignoreDuplicates: false,
        })

        if (error) {
          addDebugLog(`Error saving progress: ${error.message}`)
          throw error
        }

        addDebugLog(`Progress saved successfully`)
        setLastReportedTime(currentTime)

        // If video is 95% or more complete, mark it as watched
        if (progressPercentage >= 95 && !videoWatched) {
          addDebugLog("Video marked as watched (progress >= 95%)")
          setVideoWatched(true)
        }
      } catch (error) {
        console.error("Error saving video progress:", error)
        addDebugLog(`Error saving progress: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Handle video ended
  const handleEnded = async () => {
    if (!videoRef.current || !userId) return

    addDebugLog("Video ended, marking as complete")

    try {
      setIsSaving(true)
      const duration = videoRef.current.duration

      // Save final progress
      const { error } = await supabase.from("sop_video_progress").upsert(
        {
          user_id: userId,
          sop_id: "web-app-usage",
          video_position: duration,
          duration: duration,
          progress_percentage: 100,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id,sop_id",
          ignoreDuplicates: false,
        },
      )

      if (error) {
        addDebugLog(`Error saving final progress: ${error.message}`)
        throw error
      }

      addDebugLog("Final progress saved successfully")
      setVideoWatched(true)
      setIsPlaying(false)
    } catch (error) {
      console.error("Error saving final video progress:", error)
      addDebugLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!videoWatched) {
      toast({
        title: "Cannot complete SOP yet",
        description: "You must watch the entire video before marking this SOP as complete.",
        variant: "destructive",
      })
      return
    }

    try {
      setMarkingComplete(true)
      addDebugLog("Marking SOP as complete...")

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        addDebugLog(`Auth error: ${userError.message}`)
        throw userError
      }

      if (!user) {
        addDebugLog("No authenticated user found")
        throw new Error("User not authenticated")
      }

      // Add completion record
      const completionData = {
        sop_id: "web-app-usage",
        user_id: user.id,
        completed_at: new Date().toISOString(),
      }

      addDebugLog(`Inserting completion: ${JSON.stringify(completionData)}`)

      const { error } = await supabase.from("sop_completions").upsert(completionData, {
        onConflict: "user_id,sop_id",
        ignoreDuplicates: false,
      })

      if (error) {
        addDebugLog(`Error marking complete: ${error.message}`)
        throw error
      }

      addDebugLog("SOP marked as complete successfully")

      // Update local state
      setCompleted(true)

      toast({
        title: "SOP Completed",
        description: "You have successfully completed this SOP.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error marking SOP as complete:", error)
      addDebugLog(`Error: ${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: "Error",
        description: "There was an error marking this SOP as complete. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMarkingComplete(false)
    }
  }

  // Force save progress (keeping this function but not exposing it in UI)
  const forceSaveProgress = async () => {
    if (!videoRef.current || !userId) {
      addDebugLog("Cannot save progress: video not loaded or user not logged in")
      return
    }

    try {
      setIsSaving(true)
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      const progressPercentage = Math.floor((currentTime / duration) * 100)

      addDebugLog(
        `Force saving progress: ${progressPercentage}% (${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`,
      )

      // Create the data object
      const progressData = {
        user_id: userId,
        sop_id: "web-app-usage",
        video_position: currentTime,
        duration: duration,
        progress_percentage: progressPercentage,
        last_updated: new Date().toISOString(),
      }

      // Log the exact data we're trying to insert
      addDebugLog(`Updating data: ${JSON.stringify(progressData)}`)

      // Insert or update the progress record with proper onConflict handling
      const { data, error } = await supabase.from("sop_video_progress").upsert(progressData, {
        onConflict: "user_id,sop_id",
        ignoreDuplicates: false,
      })

      if (error) {
        addDebugLog(`Error force saving progress: ${error.message}`)
        throw error
      }

      addDebugLog("Progress force saved successfully")
      setLastReportedTime(currentTime)

      toast({
        title: "Progress Saved",
        description: `Successfully saved progress: ${progressPercentage}%`,
      })
    } catch (error) {
      console.error("Error force saving progress:", error)
      addDebugLog(`Error: ${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: "Error Saving Progress",
        description: "Failed to save progress. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle play button click
  const handlePlayClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  // Prevent video skipping
  const preventSkipping = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (videoRef.current) {
      e.preventDefault()
      // Keep the video playing at its current position
      videoRef.current.currentTime = videoRef.current.currentTime
    }
  }

  // Prevent keyboard shortcuts for skipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent arrow keys, space bar, and other keys that might control video
      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === " " ||
        e.key === "f" ||
        e.key === "m" ||
        e.key === "k"
      ) {
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Add a sample video for testing
  const sampleVideoUrl = "/gohighlevel.mp4"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-white">
      <Button
        variant="outline"
        className="mb-6 hover:bg-gray-100 transition-colors bg-white text-black border-gray-200"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge
          variant="outline"
          className="bg-white text-orange-700 border-orange-200 flex items-center gap-1 shadow-sm"
        >
          <Globe className="h-3 w-3" />
          Web App
        </Badge>
        {completed && (
          <Badge
            variant="outline"
            className="bg-white text-green-700 border-green-200 flex items-center gap-1 shadow-sm"
          >
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )}
        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 shadow-sm">
          GoHighLevel
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">How to Use GoHighLevel Web Application</h1>
      <p className="text-lg text-gray-600 mb-8">
        Comprehensive guide to using the GoHighLevel web platform for maximum productivity.
      </p>

      <Card className="mb-8 border-gray-200 shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-gray-100">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-black">
            <Video className="h-5 w-5 text-[#00a2ff]" />
            Training Video
          </CardTitle>
          <CardDescription className="text-gray-600">
            Watch the complete training video to learn how to use the GoHighLevel web application
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className="space-y-4">
            {/* Video Player with Progress Tracking */}
            <div className="flex justify-center">
              <div
                ref={videoContainerRef}
                className="relative w-full rounded-lg overflow-hidden bg-white shadow-lg border border-gray-200"
              >
                {/* Custom play button overlay */}
                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                    onClick={handlePlayClick}
                  >
                    <div className="bg-white bg-opacity-70 rounded-full p-4 shadow-lg">
                      <Play className="h-12 w-12 text-[#00a2ff]" />
                    </div>
                  </div>
                )}

                {/* Using a sample video for testing */}
                <video
                  ref={videoRef}
                  className="w-full aspect-video"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleMetadataLoaded}
                  onEnded={handleEnded}
                  playsInline
                  onSeeking={preventSkipping}
                  onSeeked={preventSkipping}
                  onClick={preventSkipping}
                  onDoubleClick={preventSkipping}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  style={{ backgroundColor: "#f8f8f8" }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={sampleVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Video Progress</span>
                <span>{videoProgress}%</span>
              </div>
              <Progress value={videoProgress} className="h-2" />

              {videoWatched ? (
                <p className="text-sm text-green-600 flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Video completed
                </p>
              ) : (
                <p className="text-sm text-orange-600 flex items-center mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Please watch the entire video
                </p>
              )}
            </div>
          </div>

          {/* SOP Content */}
          <div className="prose max-w-none mt-8">
            <h1 className="text-2xl font-bold mt-8 mb-4 text-[#00a2ff]">GoHighLevel Web Application Guide</h1>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Introduction</h2>
            <p className="text-gray-700">
              The GoHighLevel web application is your command center for CRM operations. This SOP will guide you through
              effectively using the platform to manage your business, clients, and marketing campaigns.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Accessing the Platform</h2>
            <ol className="bg-white p-4 rounded-lg border border-gray-100">
              <li className="mb-2 text-gray-700">1. Open your web browser (Chrome recommended for best experience)</li>
              <li className="mb-2 text-gray-700">2. Navigate to app.gohighlevel.com</li>
              <li className="mb-2 text-gray-700">3. Enter your email address and password</li>
              <li className="mb-2 text-gray-700">4. Click "Sign In"</li>
              <li className="mb-2 text-gray-700">
                5. If prompted, complete any two-factor authentication requirements
              </li>
            </ol>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Dashboard Overview</h2>
            <p className="text-gray-700">
              After logging in, you'll see the main dashboard with key metrics and navigation options. The dashboard
              includes:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Overview metrics showing key performance indicators</span>
              </li>
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Activity feed displaying recent actions and updates</span>
              </li>
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Calendar showing upcoming appointments and tasks</span>
              </li>
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Pipeline overview with visual representation of sales stages</span>
              </li>
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Conversation inbox showing recent client communications</span>
              </li>
              <li className="flex items-start p-2 bg-white rounded-md border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Task list with pending and upcoming tasks</span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Navigation</h2>
            <p className="text-gray-700">
              The main navigation menu is located on the left side of the screen and includes:
            </p>
            <ul className="space-y-2 mt-3">
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  1
                </span>
                <span className="text-gray-700">
                  <strong>Dashboard:</strong> Return to the main overview screen
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  2
                </span>
                <span className="text-gray-700">
                  <strong>Contacts:</strong> Manage your client database
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  3
                </span>
                <span className="text-gray-700">
                  <strong>Calendar:</strong> Schedule and manage appointments
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  4
                </span>
                <span className="text-gray-700">
                  <strong>Conversations:</strong> Handle client messages across multiple channels
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  5
                </span>
                <span className="text-gray-700">
                  <strong>Campaigns:</strong> Create and manage marketing campaigns
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  6
                </span>
                <span className="text-gray-700">
                  <strong>Funnels:</strong> Build and optimize sales funnels
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  7
                </span>
                <span className="text-gray-700">
                  <strong>Websites:</strong> Manage your websites and landing pages
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  8
                </span>
                <span className="text-gray-700">
                  <strong>Reports:</strong> Access analytics and performance data
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-white text-[#00a2ff] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#00a2ff]">
                  9
                </span>
                <span className="text-gray-700">
                  <strong>Settings:</strong> Configure your account and preferences
                </span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Contact Management</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    1
                  </span>
                  <span>Click "Contacts" in the left navigation menu</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    2
                  </span>
                  <span>Use the search bar to find specific contacts</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    3
                  </span>
                  <span>Click "Add Contact" to create a new contact</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    4
                  </span>
                  <span>Fill in the required information (name, email, phone)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    5
                  </span>
                  <span>Add additional details as needed</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    6
                  </span>
                  <span>Assign tags for segmentation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    7
                  </span>
                  <span>Click "Save" to create the contact</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Campaign Creation</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    1
                  </span>
                  <span>Click "Campaigns" in the left navigation menu</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    2
                  </span>
                  <span>Click "Create Campaign"</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    3
                  </span>
                  <span>Select the campaign type (email, SMS, etc.)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    4
                  </span>
                  <span>Name your campaign</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    5
                  </span>
                  <span>Select your target audience</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    6
                  </span>
                  <span>Create your campaign content</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    7
                  </span>
                  <span>Schedule or send immediately</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    8
                  </span>
                  <span>Review analytics after sending</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Automation Setup</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    1
                  </span>
                  <span>Click "Automations" in the left navigation menu</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    2
                  </span>
                  <span>Click "Create Automation"</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    3
                  </span>
                  <span>Select a trigger event (form submission, tag applied, etc.)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    4
                  </span>
                  <span>Add actions to be performed (send email, create task, etc.)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    5
                  </span>
                  <span>Configure conditions for branching logic if needed</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    6
                  </span>
                  <span>Test your automation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    7
                  </span>
                  <span>Activate when ready</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Reporting and Analytics</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    1
                  </span>
                  <span>Click "Reports" in the left navigation menu</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    2
                  </span>
                  <span>Select the report type you want to view</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    3
                  </span>
                  <span>Set the date range for your report</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    4
                  </span>
                  <span>Apply filters as needed</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                    5
                  </span>
                  <span>Export reports by clicking "Export" and selecting your preferred format</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Log in daily to check for new leads and tasks</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Respond to conversations within 24 hours</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Update contact information immediately after client interactions</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Use tags consistently for proper segmentation</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Review campaign analytics to optimize future campaigns</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Back up important templates and assets regularly</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Use the help documentation when encountering issues</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Troubleshooting</h2>
            <p className="text-gray-700">If you encounter issues with the platform:</p>
            <div className="bg-white p-4 rounded-lg border border-orange-100 mt-3">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
                    1
                  </span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
                    2
                  </span>
                  <span>Try using a different browser</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
                    3
                  </span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
                    4
                  </span>
                  <span>Contact support through the help icon in the bottom right</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-white text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
                    5
                  </span>
                  <span>Check the status page at status.gohighlevel.com</span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-100 pt-6 bg-white">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: May 14, 2025
          </div>
          {!completed ? (
            <Button
              onClick={handleMarkComplete}
              disabled={markingComplete || !videoWatched}
              className={`${
                videoWatched
                  ? "bg-white text-[#00a2ff] border border-[#00a2ff] hover:bg-blue-50 shadow-md transition-all hover:shadow-lg"
                  : "bg-white text-gray-400 border border-gray-200 cursor-not-allowed"
              }`}
            >
              {markingComplete ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-[#00a2ff] border-r-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Complete
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" className="border-green-200 text-green-700 bg-white shadow-sm" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
