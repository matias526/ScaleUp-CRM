"use client"

import { Suspense } from "react"
import InternalMeetingExecution from "@/components/internal-meetings/internal-meeting-execution"

export default function InternalMeetingExecutePage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>Cargando...</div>}>
        <InternalMeetingExecution />
      </Suspense>
    </div>
  )
}
