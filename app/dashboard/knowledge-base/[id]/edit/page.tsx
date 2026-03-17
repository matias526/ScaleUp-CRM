import { QuestionForm } from "@/components/knowledge-base/question-form"

export default function EditQuestionPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <QuestionForm questionId={params.id} />
    </div>
  )
}
