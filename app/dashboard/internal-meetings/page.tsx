import { Suspense } from "react"
import InternalMeetingsOverview from "@/components/internal-meetings/internal-meetings-overview"
import Loading from "./loading"

export default function InternalMeetings() {
  return (
    <Suspense fallback={<Loading />}>
      <InternalMeetingsOverview />
    </Suspense>
  )
}
