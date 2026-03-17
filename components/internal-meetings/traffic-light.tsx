"use client"

interface TrafficLightProps {
  status: "green" | "yellow" | "red"
  size?: "sm" | "md" | "lg"
}

export default function TrafficLight({ status, size = "md" }: TrafficLightProps) {
  const sizeClasses = {
    sm: "w-10 h-20",
    md: "w-14 h-28",
    lg: "w-18 h-36",
  }

  const lightSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-900 rounded-xl border-2 border-gray-700 flex flex-col items-center justify-around py-2 shadow-lg`}
    >
      {/* Red light */}
      <div
        className={`${lightSize[size]} rounded-full border border-gray-600 transition-all duration-300 ${
          status === "red" ? "bg-red-500 shadow-lg shadow-red-500/60 animate-pulse" : "bg-gray-700"
        }`}
      />

      {/* Yellow light */}
      <div
        className={`${lightSize[size]} rounded-full border border-gray-600 transition-all duration-300 ${
          status === "yellow" ? "bg-yellow-400 shadow-lg shadow-yellow-400/60 animate-pulse" : "bg-gray-700"
        }`}
      />

      {/* Green light */}
      <div
        className={`${lightSize[size]} rounded-full border border-gray-600 transition-all duration-300 ${
          status === "green" ? "bg-green-500 shadow-lg shadow-green-500/60 animate-pulse" : "bg-gray-700"
        }`}
      />
    </div>
  )
}
