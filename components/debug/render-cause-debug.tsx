"use client"

import { useState, useEffect, useRef } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface RenderCause {
  timestamp: string
  cause: string
  stackTrace: string
}

export function RenderCauseDebug() {
  const renderCount = useRef(0)
  const [renderCauses, setRenderCauses] = useState<RenderCause[]>([])
  const prevPropsRef = useRef<any>({})

  useEffect(() => {
    renderCount.current += 1
    const timestamp = new Date().toLocaleTimeString()

    // Capturar stack trace para ver qué causó el render
    const stack = new Error().stack || ""
    const relevantStack = stack.split("\n").slice(1, 5).join("\n")

    const cause = `Render #${renderCount.current}`

    setRenderCauses((prev) => [
      ...prev.slice(-10),
      {
        timestamp,
        cause,
        stackTrace: relevantStack,
      },
    ])

    console.log(`🔄 ${cause} at ${timestamp}`)
    console.log("Stack:", relevantStack)
  })

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Render Loop Detective</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p>
            <strong>Total Renders:</strong> {renderCount.current}
          </p>

          {renderCount.current > 10 && (
            <div className="bg-red-100 p-2 rounded text-sm">
              <p className="font-bold text-red-800">🚨 INFINITE RENDER LOOP DETECTED!</p>
              <p>Recent render causes:</p>
              <div className="max-h-40 overflow-y-auto font-mono text-xs">
                {renderCauses.slice(-5).map((render, i) => (
                  <div key={i} className="border-b border-red-200 py-1">
                    <div className="font-bold">
                      {render.cause} at {render.timestamp}
                    </div>
                    <div className="text-gray-600 whitespace-pre-wrap">{render.stackTrace}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
