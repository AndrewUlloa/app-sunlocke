"use client"

import { createClient } from "@/lib/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { toast } from "@/lib/toast"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      toast.loading({
        message: "Redirecting to Google...",
        description: "Please wait while we connect you"
      })

      // Get the current hostname
      const hostname = window.location.hostname
      // Construct the redirect URL ensuring it matches exactly what's in Supabase
      const redirectUrl = hostname.includes('localhost')
        ? 'http://localhost:3000/auth/callback'
        : `https://app.sunlocke.com/auth/callback`

      console.log("Using redirect URL:", redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
      if (!data.url) throw new Error("No OAuth URL returned")

      console.log("Received auth URL:", data.url)
      // Redirect to the authorization URL
      window.location.href = data.url
    } catch (err) {
      console.error("Login error:", err)
      toast.error({
        message: "Login failed",
        description: err instanceof Error ? err.message : "Please try again"
      })
    }
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <Card className="bg-transparent shadow-red-card-default transition ease-in-out duration-[400ms] hover:shadow-red-card-hover">
        <CardContent className={cn(
          "flex flex-col items-center gap-5",
          "border border-white bg-white/50",
          "px-[40px] py-[20px]",
          "md:px-[120px] md:py-[40px] md:gap-5",
          "rounded-xl"
        )}>
          <div className="flex flex-col items-center text-center ">
            <h1 className="text-[28px] font-eudoxusSansBold md:text-5xl">Welcome back!</h1>
          </div>
          <Button 
            variant="default"
            size="default"
            onClick={handleGoogleLogin}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="relative w-[250px] md:w-[400px]">
            <Image
              src="https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/674951b7115913dcaef9e527_Homepage_Spot_1_v2_1400.webp"
              alt="Two people having a conversation" 
              className="w-full h-full object-fit"
              width={400}
              height={400}
              priority
            />
          </div>
          <div className="max-w-[275px] text-[12px] text-pretty text-center font-eudoxusSansMedium text-black md:text-base md:max-w-[400px]">
            By clicking Continue with Google, you agree to our <a href="https://www.sunlocke.com/en-us/terms" className="underline underline-offset-4 hover:text-neutral-900">Terms of Service</a> and <a href="https://www.sunlocke.com/en-us/privacy-policy" className="underline underline-offset-4 hover:text-neutral-900">Privacy Policy</a>.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
