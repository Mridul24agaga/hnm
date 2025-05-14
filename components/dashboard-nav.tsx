"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Home, Users, Settings, BarChart3, ChevronRight, LogOut, User, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role?: string
}

export function DashboardNav() {
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUserProfile() {
      try {
        // Get the current authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error fetching user:", userError)
          return
        }

        // Get the user's profile from the profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          return
        }

        // Check if user has admin role (you would need to implement this logic)
        // For example, you might have a separate admins table or a role field in profiles
        const { data: adminData } = await supabase.from("admins").select("*").eq("user_id", user.id).single()

        const isUserAdmin = !!adminData

        setUserProfile(profile)
        setIsAdmin(isUserAdmin)
      } catch (error) {
        console.error("Error in getUserProfile:", error)
      }
    }

    getUserProfile()
  }, [supabase])

  // Member navigation items (limited)
  const memberNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
   
  ]

  // Admin navigation items (full access)
  const adminNavItems = [
    {
      title: "Admin Dashboard",
      href: "/admin",
      icon: BarChart3,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "SOP Tracking",
      href: "/admin/sop-tracking",
      icon: BookOpen,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    return pathname.startsWith(href) && href !== "/dashboard"
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex flex-col h-screen sticky top-0 border-r border-gray-200 bg-white">
      {/* Logo and company name */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[#0099ff] flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="font-semibold text-black">Happy Home CRM</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 mb-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3">
            {isAdmin ? "Admin Controls" : "Main"}
          </h3>
        </div>

        {/* Member navigation */}
        <nav className="grid gap-1 px-3">
          {memberNavItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                "justify-start h-10 px-3 text-gray-700 hover:text-black hover:bg-gray-100",
                isActive(item.href) &&
                  "bg-blue-50 text-[#0099ff] hover:bg-blue-50 hover:text-[#0099ff] font-medium border-l-2 border-[#0099ff]",
              )}
            >
              <Link href={item.href} className="flex items-center w-full">
                <item.icon className="mr-3 h-4 w-4" />
                {item.title}
                {isActive(item.href) && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Admin navigation - only shown for admin users */}
        {isAdmin && (
          <>
            <div className="h-px bg-gray-200 my-4 mx-3" />
            <div className="px-3 mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3">Administration</h3>
            </div>
            <nav className="grid gap-1 px-3">
              {adminNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "justify-start h-10 px-3 text-gray-700 hover:text-black hover:bg-gray-100",
                    isActive(item.href) &&
                      "bg-blue-50 text-[#0099ff] hover:bg-blue-50 hover:text-[#0099ff] font-medium border-l-2 border-[#0099ff]",
                  )}
                >
                  <Link href={item.href} className="flex items-center w-full">
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.title}
                    {isActive(item.href) && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                </Button>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* User profile section */}
      <div className="mt-auto border-t border-gray-200">
        <div className="p-4">
          {userProfile ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name} />
                <AvatarFallback className="bg-blue-50 text-[#0099ff]">
                  {getInitials(userProfile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-black truncate">{userProfile.full_name}</p>
                  {isAdmin && <Shield className="h-3.5 w-3.5 text-[#0099ff]" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-black"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#0099ff] border-r-transparent align-[-0.125em]"></div>
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
