"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function FormRenderDebug() {
  const renderCount = useRef(0)
  const [renders, setRenders] = useState<string[]>([])

  useEffect(() => {
    renderCount.current += 1
    const timestamp = new Date().toLocaleTimeString()
    setRenders((prev) => [...prev.slice(-10), `Render #${renderCount.current} at ${timestamp}`])
  })

  const clearRenders = () => {
    setRenders([])
    renderCount.current = 0
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Form Render Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p>
            Total Renders: <strong>{renderCount.current}</strong>
          </p>
          <Button onClick={clearRenders} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Recent Renders:</h3>
          <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
            {renders.length === 0 ? (
              <p className="text-gray-500">No renders recorded</p>
            ) : (
              renders.map((render, index) => (
                <div key={index} className="text-sm font-mono">
                  {render}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Normal:</strong> 1-3 renders on mount
          </p>
          <p>
            <strong>Problem:</strong> Continuous re-renders (4+)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
