"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, Download, Globe, Smartphone, Video } from "lucide-react"
import { Separator } from "@/components/ui/seperator"

interface Sop {
  id: string
  title: string
  description: string
  content?: string
  video_url?: string
  completed: boolean
  type: "mobile" | "web"
  platform: string
  created_at?: string
  updated_at?: string
}

export default function SopPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const [sop, setSop] = useState<Sop | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchSop = async () => {
      try {
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        // Fetch the specific SOP
        const { data: sopData, error: sopError } = await supabase.from("sops").select("*").eq("id", id).single()

        if (sopError) {
          // If SOP not found in database, use sample data based on ID
          if (id === "mobile-app-overview") {
            setSop({
              id: "mobile-app-overview",
              title: "GoHighLevel Mobile App Overview",
              description:
                "Learn how to navigate and use the GoHighLevel mobile application for on-the-go CRM management.",
              content: `
# GoHighLevel Mobile App Overview

## Introduction
The GoHighLevel mobile app provides a comprehensive set of tools for managing your CRM on the go. This SOP will guide you through the essential features and navigation of the mobile application.

## App Installation
1. Download the app from the App Store (iOS) or Google Play Store (Android)
2. Log in with your GoHighLevel credentials
3. Enable notifications when prompted for optimal experience

## Key Features
- **Dashboard**: View key metrics and performance indicators
- **Contacts**: Access and manage your client database
- **Calendar**: Schedule and manage appointments
- **Conversations**: Respond to client messages across multiple channels
- **Tasks**: Manage your to-do list and track progress
- **Pipelines**: Monitor sales pipelines and deal progress

## Navigation Tips
- Use the bottom navigation bar to switch between main sections
- Swipe down to refresh data on any screen
- Use the search function to quickly find contacts or information
- Long-press on items to access additional options

## Best Practices
- Check notifications daily
- Respond to client messages within business hours
- Update contact information immediately after client calls
- Sync data when on WiFi to save mobile data usage

## Troubleshooting
If you encounter issues with the app:
1. Force close and restart the app
2. Check your internet connection
3. Ensure you're using the latest version
4. Contact support if problems persist
              `,
              completed: false,
              type: "mobile",
              platform: "GoHighLevel",
              created_at: "2023-01-15T00:00:00.000Z",
              updated_at: "2023-04-22T00:00:00.000Z",
            })
          } else if (id === "mobile-app-client-management") {
            setSop({
              id: "mobile-app-client-management",
              title: "Client Management on Mobile",
              description:
                "Master client management features in the GoHighLevel mobile app for efficient relationship management.",
              content: `
# Client Management on GoHighLevel Mobile App

## Introduction
Effective client management is essential for business success. The GoHighLevel mobile app provides powerful tools to manage client relationships on the go.

## Accessing Client Database
1. Tap the "Contacts" icon in the bottom navigation bar
2. Use the search bar to find specific clients
3. Browse alphabetically or by recently contacted
4. Use filters to segment your client list

## Adding New Clients
1. Tap the "+" button in the Contacts section
2. Fill in required fields (name, email, phone)
3. Add additional information as needed
4. Assign tags and custom fields
5. Save the contact

## Managing Client Information
1. Tap on a client's name to view their profile
2. Edit information by tapping the "Edit" button
3. Add notes about interactions
4. View communication history
5. Schedule follow-ups

## Communication Tools
1. Call clients directly from their profile
2. Send SMS messages with templates
3. Send emails with tracking
4. Schedule appointments
5. Record voice notes

## Pipeline Management
1. Add clients to pipelines
2. Move clients between pipeline stages
3. Set follow-up tasks
4. Track conversion metrics
5. View pipeline analytics

## Best Practices
- Update client information immediately after calls
- Use tags consistently for segmentation
- Document all significant client interactions
- Review client activity before meetings
- Set reminders for follow-ups
              `,
              completed: false,
              type: "mobile",
              platform: "GoHighLevel",
              created_at: "2023-02-10T00:00:00.000Z",
              updated_at: "2023-05-18T00:00:00.000Z",
            })
          } else if (id === "web-app-dashboard") {
            setSop({
              id: "web-app-dashboard",
              title: "GoHighLevel Web Dashboard",
              description: "Comprehensive guide to using the GoHighLevel web dashboard for maximum productivity.",
              content: `
# GoHighLevel Web Dashboard

## Introduction
The GoHighLevel web dashboard is your command center for CRM operations. This SOP will guide you through effectively using the dashboard to monitor and manage your business.

## Accessing the Dashboard
1. Log in to your GoHighLevel account at app.gohighlevel.com
2. Enter your credentials
3. The dashboard is the first screen you'll see after login

## Dashboard Components
- **Overview Metrics**: Key performance indicators at the top
- **Activity Feed**: Recent actions and updates
- **Calendar**: Upcoming appointments and tasks
- **Pipeline Overview**: Visual representation of sales stages
- **Conversation Inbox**: Recent client communications
- **Task List**: Pending and upcoming tasks

## Customizing Your Dashboard
1. Click the "Customize" button in the top right
2. Drag and drop widgets to rearrange
3. Add or remove widgets as needed
4. Adjust time periods for metrics
5. Save your customized layout

## Analyzing Performance Data
1. Use date filters to view specific time periods
2. Compare current performance to previous periods
3. Drill down into specific metrics for detailed analysis
4. Export reports for team meetings
5. Set up automated reports

## Team Management
1. View team member activity
2. Assign tasks to team members
3. Monitor individual performance
4. Set goals and track progress
5. Manage permissions and access

## Best Practices
- Review dashboard metrics daily
- Use insights to guide daily priorities
- Share relevant metrics with team members
- Set up alerts for important thresholds
- Schedule regular performance reviews
              `,
              completed: false,
              type: "web",
              platform: "GoHighLevel",
              created_at: "2023-03-05T00:00:00.000Z",
              updated_at: "2023-06-12T00:00:00.000Z",
            })
          } else if (id === "web-app-automation") {
            setSop({
              id: "web-app-automation",
              title: "Setting Up Automation Workflows",
              description: "Learn how to create powerful automation workflows in the GoHighLevel web application.",
              content: `
# Setting Up Automation Workflows in GoHighLevel

## Introduction
Automation is one of GoHighLevel's most powerful features. This SOP will guide you through creating effective automation workflows to save time and improve client experiences.

## Accessing Automation Builder
1. Log in to your GoHighLevel account
2. Navigate to "Automations" in the left sidebar
3. Click "Create New Automation" to begin

## Understanding Triggers
Automations start with triggers, which include:
- Form submissions
- Appointment bookings
- Pipeline stage changes
- Tag applications
- Custom webhook events
- Time-based events

## Building Action Sequences
After selecting a trigger, add actions:
1. Click the "+" button to add an action
2. Choose from available action types:
   - Send email
   - Send SMS
   - Create task
   - Apply tag
   - Move in pipeline
   - Wait timer
   - Conditional logic
3. Configure each action with necessary details
4. Add additional actions as needed

## Using Conditional Logic
1. Add a "Condition" action to create branches
2. Set up "if/then" scenarios based on:
   - Contact properties
   - User behavior
   - Time conditions
   - Custom field values
3. Create different action paths for each condition

## Testing Automations
1. Click "Test" button before activating
2. Select a test contact
3. Review the simulation results
4. Make adjustments as needed
5. Activate when satisfied with the workflow

## Monitoring Performance
1. View automation analytics in the dashboard
2. Check completion rates and failures
3. Identify bottlenecks or issues
4. Optimize based on performance data

## Best Practices
- Start with simple automations and build complexity
- Document the purpose of each automation
- Use descriptive names for easy identification
- Regularly review and optimize workflows
- Test thoroughly before activating
              `,
              completed: false,
              type: "web",
              platform: "GoHighLevel",
              created_at: "2023-04-20T00:00:00.000Z",
              updated_at: "2023-07-05T00:00:00.000Z",
            })
          } else {
            // Generic SOP for unknown IDs
            setSop({
              id: id as string,
              title: "GoHighLevel SOP",
              description: "Standard Operating Procedure for GoHighLevel platform",
              content: "This SOP content is being developed. Please check back later.",
              completed: false,
              type: Math.random() > 0.5 ? "mobile" : "web",
              platform: "GoHighLevel",
            })
          }
          setLoading(false)
          return
        }

        // Fetch completion status
        const { data: completionData, error: completionError } = await supabase
          .from("sop_completions")
          .select("*")
          .eq("sop_id", id)
          .eq("user_id", user.id)
          .single()

        if (completionError && completionError.code !== "PGRST116") {
          console.error("Error fetching completion status:", completionError)
        }

        // Format the SOP data
        const formattedSop = {
          id: sopData.id,
          title: sopData.title,
          description: sopData.description,
          content: sopData.content,
          video_url: sopData.video_url,
          completed: !!completionData,
          type: sopData.type || (sopData.title.toLowerCase().includes("mobile") ? "mobile" : "web"),
          platform: sopData.platform || "GoHighLevel",
          created_at: sopData.created_at,
          updated_at: sopData.updated_at,
        }

        setSop(formattedSop)
      } catch (error) {
        console.error("Error fetching SOP:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSop()
    }
  }, [id, supabase])

  const handleMarkComplete = async () => {
    try {
      setMarkingComplete(true)

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Add completion record
      const { error } = await supabase.from("sop_completions").insert({
        sop_id: id,
        user_id: user.id,
        completed_at: new Date().toISOString(),
      })

      if (error) throw error

      // Update local state
      setSop((prev) => (prev ? { ...prev, completed: true } : null))
    } catch (error) {
      console.error("Error marking SOP as complete:", error)
    } finally {
      setMarkingComplete(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00a2ff] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading SOP content...</p>
        </div>
      </div>
    )
  }

  if (!sop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-12 text-gray-600">
          <h2 className="text-2xl font-bold mb-4">SOP Not Found</h2>
          <p>The requested Standard Operating Procedure could not be found.</p>
          <Button variant="outline" className="mt-6" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-wrap gap-2 mb-6">
        {sop.type === "mobile" ? (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            Mobile App
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
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
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {sop.platform}
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">{sop.title}</h1>
      <p className="text-lg text-gray-600 mb-8">{sop.description}</p>

      <Card className="mb-8 border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-[#00a2ff]" />
            Training Content
          </CardTitle>
          <CardDescription>
            Complete this training to master {sop.type === "mobile" ? "mobile app" : "web platform"} functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Video placeholder - in a real app, this would be an actual video player */}
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Training video for {sop.title}</p>
              <Button variant="outline" className="mt-4">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
            </div>
          </div>

          {/* SOP Content */}
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: sop.content
                  ? sop.content
                      .replace(/\n## /g, '<h2 class="text-xl font-semibold mt-6 mb-3">')
                      .replace(/\n# /g, '<h1 class="text-2xl font-bold mt-8 mb-4">')
                      .replace(/\n- /g, '<li class="mb-1">')
                      .replace(/\n\d\. /g, (match) => `<li class="mb-1">${match.trim().replace(". ", "")}. `)
                      .replace(/\n/g, "<br />")
                  : "No content available for this SOP.",
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {sop.updated_at ? new Date(sop.updated_at).toLocaleDateString() : "N/A"}
          </div>
          {!sop.completed ? (
            <Button onClick={handleMarkComplete} disabled={markingComplete} className="bg-[#00a2ff] hover:bg-[#0082cc]">
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
            <Button variant="outline" className="border-green-200 text-green-700 bg-green-50" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
          )}
        </CardFooter>
      </Card>

      <Separator className="my-8" />

      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need additional help?</h3>
        <p className="text-gray-600 mb-4">Contact the GoHighLevel support team for assistance</p>
        <Button variant="outline">Contact Support</Button>
      </div>
    </div>
  )
}
