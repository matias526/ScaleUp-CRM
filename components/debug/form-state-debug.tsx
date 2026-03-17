"use client"

import { useEffect, useState } from "react"

interface FormStateDebugProps {
  formValues: any
  currentStep: number
  watchedValues: any
}

export function FormStateDebug({ formValues, currentStep, watchedValues }: FormStateDebugProps) {
  const [stateHistory, setStateHistory] = useState<any[]>([])

  useEffect(() => {
    const newEntry = {
      timestamp: new Date().toISOString(),
      step: currentStep,
      formValues: { ...formValues },
      watchedValues: { ...watchedValues },
    }

    setStateHistory((prev) => [...prev.slice(-10), newEntry]) // Keep last 10 entries

    console.log("FORM STATE CHANGE:", newEntry)
  }, [formValues, currentStep, watchedValues])

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto bg-white border shadow-lg rounded p-4 z-50">
      <h3 className="font-bold mb-2">Form State Debug</h3>
      <div className="text-xs space-y-2">
        {stateHistory.slice(-3).map((entry, index) => (
          <div key={index} className="bg-gray-100 p-2 rounded">
            <div className="font-semibold">
              Step {entry.step} - {entry.timestamp.split("T")[1].split(".")[0]}
            </div>
            <div>Form: {JSON.stringify(entry.formValues, null, 1).substring(0, 100)}...</div>
            <div>Watch: {JSON.stringify(entry.watchedValues, null, 1).substring(0, 100)}...</div>
          </div>
        ))}
      </div>
    </div>
  )
}
