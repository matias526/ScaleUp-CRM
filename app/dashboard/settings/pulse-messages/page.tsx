"use client"

import { PulseMessageSender } from "@/components/pulse/pulse-message-sender"

export default function PulseMessagesPage() {
  return (
    <div className="w-full">
      <PulseMessageSender open={true} onOpenChange={() => {}} />
    </div>
  )
}
