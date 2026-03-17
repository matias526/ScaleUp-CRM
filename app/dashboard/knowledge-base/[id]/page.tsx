import { QuestionDetail } from "@/components/knowledge-base/question-detail"

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <QuestionDetail questionId={params.id} />
    </div>
  )
}
