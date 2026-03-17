"use client"

interface FunnelStage {
  name: string
  count: number
  value: number
  color: string
}

interface FunnelVisualProps {
  stages: FunnelStage[]
}

export default function FunnelVisual({ stages }: FunnelVisualProps) {
  const maxCount = Math.max(...stages.map((s) => s.count))

  return (
    <div className="relative">
      {/* Funnel Shape */}
      <div className="space-y-1">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 10) : 10

          return (
            <div key={stage.name} className="relative">
              {/* Stage Number */}
              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-10">
                <div
                  className={`w-6 h-6 rounded-sm flex items-center justify-center text-white text-sm font-bold ${stage.color}`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Funnel Section */}
              <div
                className={`${stage.color} rounded-r-lg relative overflow-hidden transition-all duration-300 hover:shadow-lg`}
                style={{
                  width: `${widthPercentage}%`,
                  minWidth: "120px",
                  height: "48px",
                }}
              >
                {/* Stage Content */}
                <div className="flex items-center justify-between h-full px-4 text-white">
                  <div>
                    <div className="font-semibold text-sm">{stage.name.toUpperCase()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stage.count}</div>
                    <div className="text-xs opacity-90">${(stage.value / 1000).toFixed(0)}K</div>
                  </div>
                </div>

                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
