"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ThumbsUp, ThumbsDown, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ filename: string; chunk_text: string }>
  created_at: string
  userRating?: number
}

interface Conversation {
  id: string
  title: string
  tech_company_id: string
  created_at: string
}

interface TechCompany {
  id: string
  name: string
}

interface MikaChatProps {
  techCompanies: TechCompany[]
  userTechCompanyId?: string
}

export function MikaChat({ techCompanies, userTechCompanyId }: MikaChatProps) {
  const [selectedTech, setSelectedTech] = useState<string>(userTechCompanyId || "")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedTech) {
      loadConversations()
    }
  }, [selectedTech])

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/ai-knowledge-base/conversations?tech_company_id=${selectedTech}`)
      if (!response.ok) throw new Error("Error al cargar conversaciones")
      const data = await response.json()
      setConversations(data.data || [])
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-knowledge-base/conversations/${conversationId}/messages`)
      if (!response.ok) throw new Error("Error al cargar mensajes")
      const data = await response.json()
      setMessages(data.data || [])
      setCurrentConversation(conversationId)
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      })
    }
  }

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedTech) return

    console.log("[v0 CLIENT] Sending message:", input)
    console.log("[v0 CLIENT] Previous messages count:", messages.length)

    // Detectar si es una corrección
    const correctionPatterns = [/^no[,\s]/i, /eso no es correcto/i, /eso está mal/i, /te equivocas/i, /no es así/i]
    const isCorrection = correctionPatterns.some((pattern) => pattern.test(input.trim()))
    console.log("[v0 CLIENT] Is correction detected:", isCorrection)

    const isLearnCommand = /^\*\*\*aprender\*\*\*|^\*\*\*aprende\*\*\*|^\*\*\*learn\*\*\*/i.test(input)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageToSend = input
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-knowledge-base/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          tech_company_id: selectedTech,
          conversation_id: currentConversation,
          previous_messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error("Error al enviar mensaje")

      const data = await response.json()

      console.log("[v0 CLIENT] Response received")
      console.log("[v0 CLIENT] Debug info:", data.debug)

      if (data.debug?.isCorrection) {
        console.log("[v0 CLIENT] ✅ Server detected correction!")
        console.log("[v0 CLIENT] Correction saved:", data.debug.correctionSaved)
        console.log("[v0 CLIENT] Learning examples found:", data.debug.learningExamplesFound)

        if (data.debug.correctionSaved) {
          toast({
            title: "✅ Mika aprendió de tu corrección",
            description: `${
              data.debug.learningExamplesFound > 0
                ? `Encontró ${data.debug.learningExamplesFound} ejemplos previos similares para mejorar futuras respuestas.`
                : "Este es el primer ejemplo de este tipo. ¡Gracias por enseñarme!"
            }`,
          })
        } else {
          toast({
            title: "⚠️ Corrección detectada",
            description: "No pude guardar la corrección. Verifica los logs del servidor.",
            variant: "destructive",
          })
        }
      }

      if (data.learningStatus === "saved") {
        toast({
          title: "Aprendizaje guardado",
          description: "Mika aplicará este conocimiento en futuras consultas similares.",
        })
      } else if (data.learningStatus === "error") {
        toast({
          title: "Error al guardar aprendizaje",
          description: "Por favor verifica los logs del servidor.",
          variant: "destructive",
        })
      }

      if (data.learningExamplesUsed > 0 && !isLearnCommand) {
        console.log(`[v0] Mika usó ${data.learningExamplesUsed} ejemplos de aprendizaje previos`)
      }

      const assistantMessage: Message = {
        id: data.message_id || Date.now().toString(),
        role: "assistant",
        content: data.response,
        sources: data.sources,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!currentConversation && data.conversation_id) {
        setCurrentConversation(data.conversation_id)
        loadConversations()
      }
    } catch (error) {
      console.error("[v0 CLIENT] Error sending message:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, rating: number) => {
    console.log("[v0] Sending feedback:", { messageId, rating })

    try {
      const response = await fetch("/api/ai-knowledge-base/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          rating,
        }),
      })

      console.log("[v0] Feedback response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Feedback error:", errorData)
        throw new Error(errorData.error || "Error al enviar feedback")
      }

      const data = await response.json()
      console.log("[v0] Feedback saved:", data)

      toast({
        title: "Gracias por tu feedback",
        description: "Esto ayuda a Mika Techie a mejorar",
      })

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, userRating: rating } : msg)))
    } catch (error) {
      console.error("[v0] Error sending feedback:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el feedback",
        variant: "destructive",
      })
    }
  }

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tecnología</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tecnología" />
              </SelectTrigger>
              <SelectContent>
                {techCompanies.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversaciones</CardTitle>
              <Button size="sm" variant="outline" onClick={startNewConversation}>
                Nueva
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay conversaciones</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadMessages(conv.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentConversation === conv.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-sm truncate">{conv.title || "Nueva conversación"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.created_at).toLocaleDateString()}{" "}
                    {new Date(conv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="col-span-9">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mikaT-LvGFPTVcDpkmp3FrAEE0H8AteIg5m3.jpeg"
                  alt="Mika Techie"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                  MT
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Mika Techie <Sparkles className="h-4 w-4 text-yellow-500" />
                </CardTitle>
                <CardDescription>Tu asistente experto en tecnología</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mikaT-LvGFPTVcDpkmp3FrAEE0H8AteIg5m3.jpeg"
                    alt="Mika Techie"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-2xl">
                    MT
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Hola, soy Mika Techie</h3>
                  <p className="text-muted-foreground max-w-md">
                    Estoy aquí para ayudarte con cualquier pregunta sobre{" "}
                    {techCompanies.find((t) => t.id === selectedTech)?.name || "tu tecnología"}. Pregúntame lo que
                    necesites.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mikaT-LvGFPTVcDpkmp3FrAEE0H8AteIg5m3.jpeg"
                        alt="Mika Techie"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs">
                        MT
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col gap-2 max-w-[80%]`}>
                    <div
                      className={`rounded-lg p-4 ${
                        message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-gray-100"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <button
                          onClick={() => toggleSources(message.id)}
                          className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
                        >
                          {expandedSources.has(message.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          Fuentes ({message.sources.length})
                        </button>
                        {expandedSources.has(message.id) && (
                          <div className="mt-1 space-y-1 pl-4">
                            {message.sources.map((source, idx) => (
                              <p key={idx}>• {source.filename}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleFeedback(message.id, 1)}
                          disabled={isLoading}
                        >
                          <ThumbsUp
                            className={`h-3 w-3 ${(message as any).userRating === 1 ? "fill-green-500 text-green-500" : ""}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleFeedback(message.id, -1)}
                          disabled={isLoading}
                        >
                          <ThumbsDown
                            className={`h-3 w-3 ${(message as any).userRating === -1 ? "fill-red-500 text-red-500" : ""}`}
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0">
                      <AvatarFallback className="text-white font-bold text-xs">TU</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mikaT-LvGFPTVcDpkmp3FrAEE0H8AteIg5m3.jpeg"
                    alt="Mika Techie"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs">
                    MT
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Pregúntale a Mika Techie..."
                disabled={!selectedTech || isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || !selectedTech || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
