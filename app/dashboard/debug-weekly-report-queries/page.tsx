import WeeklyReportQueriesDebug from "@/components/debug/weekly-report-queries-debug"

export default function DebugWeeklyReportQueriesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug Weekly Report Queries</h1>
        <p className="text-muted-foreground">
          Herramienta para debuggear las queries del reporte semanal y identificar problemas
        </p>
      </div>
      <WeeklyReportQueriesDebug />
    </div>
  )
}
