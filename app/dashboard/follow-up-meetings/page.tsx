import { Suspense } from "react"
import FollowUpMeetingsPage from "@/components/follow-up-meetings/follow-up-meetings-page"
import Loading from "./loading"

export default function FollowUpMeetings() {
  return (
    <Suspense fallback={<Loading />}>
      <FollowUpMeetingsPage />
    </Suspense>
  )
}
