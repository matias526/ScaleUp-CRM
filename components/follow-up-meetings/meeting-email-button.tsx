"use client"

import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/hooks/use-translation"

interface MeetingEmailButtonProps {
  meetingId: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function MeetingEmailButton({ meetingId, variant = "outline", size = "sm" }: MeetingEmailButtonProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const handleClick = () => {
    router.push(`/dashboard/follow-up-meetings/email-preview?id=${meetingId}`)
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick}>
      <Mail className="h-4 w-4 mr-2" />
      {t("meeting.generate_report", "Generar Reporte")}
    </Button>
  )
}
