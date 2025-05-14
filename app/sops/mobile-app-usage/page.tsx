"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, Smartphone, Video, Lock, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

export default function MobileAppSopPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [completed, setCompleted] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastReportedTime, setLastReportedTime] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
          .eq("sop_id", "mobile-app-usage")
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
          .eq("sop_id", "mobile-app-usage")
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
          sop_id: "mobile-app-usage",
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
          sop_id: "mobile-app-usage",
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
        sop_id: "mobile-app-usage",
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
        sop_id: "mobile-app-usage",
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
  const sampleVideoUrl = "/app.mp4"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-white">
      <Button
        variant="outline"
        className="mb-6 hover:bg-gray-100 transition-colors"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 shadow-sm"
        >
          <Smartphone className="h-3 w-3" />
          Mobile App
        </Badge>
        {completed && (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 shadow-sm"
          >
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )}
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
          GoHighLevel
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">How to Use GoHighLevel Mobile Application</h1>
      <p className="text-lg text-gray-600 mb-8">
        Comprehensive guide to using the GoHighLevel mobile app for on-the-go productivity.
      </p>

      <Card className="mb-8 border-gray-200 shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-gray-100">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-black">
            <Video className="h-5 w-5 text-purple-600" />
            Training Video
          </CardTitle>
          <CardDescription className="text-gray-600">
            Watch the complete training video to learn how to use the GoHighLevel mobile application
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className="space-y-4">
            {/* Video Player with Progress Tracking - 9:16 aspect ratio */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[400px] rounded-lg overflow-hidden bg-black shadow-lg">
                {/* Using a sample video for testing with 9:16 aspect ratio */}
                <video
                  ref={videoRef}
                  className="w-full aspect-[9/16]"
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
                >
                  <source src={sampleVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Lock overlay if not completed */}
                {!videoWatched && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="text-sm">You must watch the entire video to complete this SOP</span>
                  </div>
                )}
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
            <h1 className="text-2xl font-bold mt-8 mb-4 text-purple-600">GoHighLevel Mobile Application Guide</h1>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Introduction</h2>
            <p className="text-gray-700">
              The GoHighLevel mobile application puts the power of your CRM in your pocket. This SOP will guide you
              through effectively using the mobile app to manage your business on the go.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Installing the App</h2>
            <ol className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <li className="mb-2 text-gray-700">1. Open the App Store (iOS) or Google Play Store (Android)</li>
              <li className="mb-2 text-gray-700">2. Search for "GoHighLevel"</li>
              <li className="mb-2 text-gray-700">3. Tap "Install" or "Get"</li>
              <li className="mb-2 text-gray-700">4. Wait for the download to complete</li>
              <li className="mb-2 text-gray-700">5. Open the app once installation is complete</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Logging In</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Open the GoHighLevel app on your mobile device</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Enter your email address</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Enter your password</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Tap "Sign In"</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>Complete any two-factor authentication if prompted</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Mobile App Navigation</h2>
            <p className="text-gray-700">The mobile app has a bottom navigation bar with these main sections:</p>
            <ul className="space-y-2 mt-3">
              <li className="flex items-center gap-2 text-gray-700">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>Dashboard:</strong> Overview of key metrics and recent activity
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  <strong>Contacts:</strong> Access your contact database
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  <strong>Calendar:</strong> View and manage appointments
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>
                  <strong>Conversations:</strong> Manage client messages and communications
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>
                  <strong>More:</strong> Access additional features and settings
                </span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Managing Contacts on Mobile</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Tap the "Contacts" icon in the bottom navigation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Use the search bar at the top to find specific contacts</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Tap the "+" icon to add a new contact</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Fill in the required information</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>Tap "Save" to create the contact</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Mobile Conversations</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Tap the "Conversations" icon in the bottom navigation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>View all recent conversations across channels (SMS, email, etc.)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Tap on a conversation to view the full thread</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Type your message in the text field at the bottom</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>Tap the send button to send your message</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Calendar Management</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Tap the "Calendar" icon in the bottom navigation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>View your appointments in day, week, or month view</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Tap the "+" icon to add a new appointment</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Fill in appointment details (title, time, contact, etc.)</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>Tap "Save" to create the appointment</span>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Mobile App Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Push notifications for new leads and messages</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Quick response templates for messages</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Voice-to-text for message composition</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Contact scanning with your phone camera</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Offline mode for viewing contacts without internet</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Location-based reminders for appointments</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Mobile App Best Practices</h2>
            <ul className="space-y-2 mt-3">
              <li className="flex items-start p-2 bg-blue-50 rounded-md">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Enable push notifications to stay updated on important activities</span>
              </li>
              <li className="flex items-start p-2 bg-blue-50 rounded-md">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  Sync your data regularly when you have a strong internet connection
                </span>
              </li>
              <li className="flex items-start p-2 bg-blue-50 rounded-md">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Use the mobile app's quick actions for faster task completion</span>
              </li>
              <li className="flex items-start p-2 bg-blue-50 rounded-md">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Keep your app updated to the latest version for new features</span>
              </li>
              <li className="flex items-start p-2 bg-blue-50 rounded-md">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  Use biometric authentication (fingerprint/face ID) for quicker access
                </span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Troubleshooting</h2>
            <p className="text-gray-700">If you encounter issues with the mobile app:</p>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mt-3">
              <ol className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Force close the app and reopen it</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Clear the app cache in your device settings</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Update the app to the latest version</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>Contact support through the help section in the app</span>
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
                  ? "bg-purple-600 hover:bg-purple-700 shadow-md transition-all hover:shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {markingComplete ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
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
            <Button variant="outline" className="border-green-200 text-green-700 bg-green-50 shadow-sm" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
