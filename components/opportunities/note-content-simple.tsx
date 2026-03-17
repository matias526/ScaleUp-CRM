interface NoteContentSimpleProps {
  content: string
}

export function NoteContentSimple({ content }: NoteContentSimpleProps) {
  // Verificar si el contenido es válido
  if (!content) {
    return <div className="text-red-500">Error: Contenido de nota inválido</div>
  }

  // Renderizar el contenido como texto plano
  return <div className="whitespace-pre-wrap">{content}</div>
}
