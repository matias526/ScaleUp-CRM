"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays, Check, ChevronDown, ChevronRight, ClipboardCheck, Loader2, MessageSquare, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

type ChecklistItem = {
  id: string
  parent_id: string | null
  title: Record<string, string> | null
  description: Record<string, string> | null
  weight: number
  order_index: number
  is_completed: boolean
  user_selected_date: string | null
  completed_at: string | null
  completed_by: string | null
  comment: string | null
}

const language = () => {
  const value = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "es"
  return ["es", "en", "pt"].includes(value) ? value : "es"
}

export function OpportunityChecklist({ opportunityId, canEdit = true }: { opportunityId: string; canEdit?: boolean }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChecklistItem | null>(null)
  const [comment, setComment] = useState("")
  const [date, setDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set())
  const lang = language()

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("opportunity_checklist_items" as any).select("*").eq("opportunity_id", opportunityId).order("order_index", { ascending: true })
    if (error) toast({ title: "No se pudo cargar el checklist", description: error.message, variant: "destructive" })
    setItems((data as unknown as ChecklistItem[]) || [])
    setLoading(false)
  }, [opportunityId])

  useEffect(() => { void load() }, [load])

  const roots = useMemo(() => items.filter((item) => !item.parent_id), [items])
  const children = (id: string) => items.filter((item) => item.parent_id === id)
  const calculateProgress = useCallback((currentItems: ChecklistItem[]) => {
    const childrenOf = (id: string) => currentItems.filter((item) => item.parent_id === id)
    const calculateNode = (item: ChecklistItem): number => {
      const nested = childrenOf(item.id)
      if (!nested.length) return item.is_completed ? 100 : 0
      const total = nested.reduce((sum, child) => sum + Number(child.weight || 0), 0) || 100
      return nested.reduce((sum, child) => sum + (Number(child.weight || 0) / total) * calculateNode(child), 0)
    }
    const total = currentItems.filter((item) => !item.parent_id).reduce((sum, root) => sum + Number(root.weight || 0), 0) || 100
    return Math.round(currentItems.filter((item) => !item.parent_id).reduce((sum, root) => sum + (Number(root.weight || 0) / total) * calculateNode(root), 0))
  }, [])
  const progress = calculateProgress(items)

  const persist = async (item: ChecklistItem, completed: boolean, nextComment = item.comment, nextDate = item.user_selected_date) => {
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (completed && (!nextDate || !(nextComment || "").trim())) {
      toast({ title: "Faltan datos", description: "Para completar el ítem debes indicar fecha y comentario.", variant: "destructive" })
      setSaving(false)
      return
    }
    const normalizedComment = nextComment || ""
    const now = new Date().toISOString()
    const patch = { is_completed: completed, comment: completed ? normalizedComment.trim() : null, user_selected_date: completed ? nextDate : null, completed_at: completed ? now : null, completed_by: completed ? user.user?.id || null : null }
    let next = items.map((current) => current.id === item.id ? { ...current, ...patch } : current) as ChecklistItem[]
    const updatedParents = new Set<string>()
    let changed = true
    while (changed) {
      changed = false
      for (const parent of next.filter((current) => next.some((child) => child.parent_id === current.id))) {
        const nested = next.filter((child) => child.parent_id === parent.id)
        const shouldComplete = nested.length > 0 && nested.every((child) => child.is_completed)
        if (parent.is_completed !== shouldComplete) {
          next = next.map((current) => current.id === parent.id ? { ...current, is_completed: shouldComplete, completed_at: shouldComplete ? now : null, completed_by: shouldComplete ? user.user?.id || null : null } : current)
          updatedParents.add(parent.id)
          changed = true
        }
      }
    }
    const parentUpdates = Array.from(updatedParents).map((id) => { const parent = next.find((current) => current.id === id)!; return { id, patch: { is_completed: parent.is_completed, completed_at: parent.completed_at, completed_by: parent.completed_by } } })
    const { error } = await supabase.from("opportunity_checklist_items" as any).update(patch).eq("id", item.id).eq("opportunity_id", opportunityId)
    if (!error) for (const parentUpdate of parentUpdates) await supabase.from("opportunity_checklist_items" as any).update(parentUpdate.patch).eq("id", parentUpdate.id).eq("opportunity_id", opportunityId)
    if (error) toast({ title: "No se pudo actualizar el ítem", description: error.message, variant: "destructive" })
    else {
      setItems(next)
      const nextProgress = calculateProgress(next)
      await supabase.from("opportunities").update({ probability: nextProgress }).eq("id", opportunityId)
      toast({ title: completed ? "Ítem completado" : "Ítem desmarcado" })
      if (completed) setSelected(null)
    }
    setSaving(false)
  }

  const selectItem = (item: ChecklistItem) => { setSelected(item); setComment(item.comment || ""); setDate(item.user_selected_date || "") }
  const toggleRoot = (id: string) => setExpandedRoots((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const title = (item: ChecklistItem) => item.title?.[lang] || item.title?.es || item.title?.en || "Ítem"
  const description = (item: ChecklistItem) => item.description?.[lang] || item.description?.es || item.description?.en || ""

  const renderItem = (item: ChecklistItem, level = 0) => {
    const nested = children(item.id)
    const isRoot = level === 0
    const isExpanded = isRoot ? expandedRoots.has(item.id) : true
    return <div key={item.id} className="border-b last:border-b-0">
      <div className="flex items-start gap-3 py-3" style={{ paddingLeft: `${level * 1.25}rem` }}>
        <Checkbox checked={item.is_completed} disabled={!canEdit || saving || item.is_completed} onClick={(event) => { if (!item.is_completed) { event.preventDefault(); selectItem(item) } }} aria-label={title(item)} />
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => isRoot && nested.length ? toggleRoot(item.id) : selectItem(item)}><p className={item.is_completed ? "font-medium line-through text-muted-foreground" : "font-medium"}>{title(item)}</p><p className="text-sm text-muted-foreground">{description(item)}</p></div>
        <Badge variant={item.is_completed ? "default" : "secondary"}>{item.is_completed ? "100%" : `${item.weight}%`}</Badge>{canEdit && !item.is_completed && <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => selectItem(item)}>Completar</Button>}
        {nested.length > 0 && (item.is_completed ? <ChevronDown className="mt-1 size-4" /> : <ChevronRight className="mt-1 size-4" />)}
      </div>
      {nested.length > 0 && isExpanded && <div className="bg-muted/20">{nested.map((child) => renderItem(child, level + 1))}</div>}
    </div>
  }

  if (loading) return <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Cargando checklist...</CardContent></Card>
  if (!items.length) return null

  return <>
    <Card className="mb-5 overflow-hidden border-border/70 shadow-none">
      <CardContent className="px-4 py-4 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground"><ClipboardCheck className="size-4 text-muted-foreground" />Probabilidad</div>
          <span className="text-sm font-semibold tabular-nums text-foreground">{progress}%</span>
        </div>
        <div className="flex h-14 w-full overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">{roots.map((root) => { const rootChildren = children(root.id); const rootProgress = rootChildren.length ? calculateProgress([root, ...rootChildren]) : root.is_completed ? 100 : 0; const fillColor = rootProgress === 100 ? "bg-emerald-500" : rootProgress > 0 ? "bg-amber-400" : "bg-muted-foreground/15"; return <button key={root.id} type="button" title={`${title(root)} · ${rootProgress}%`} className="relative h-full min-w-0 overflow-hidden border-r border-background text-left transition-all hover:brightness-95 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary last:border-r-0" style={{ width: `${root.weight}%` }} onClick={() => { if (rootChildren.length) toggleRoot(root.id); else selectItem(root) }}><span className={`absolute inset-y-0 left-0 ${fillColor} transition-[width]`} style={{ width: `${rootProgress}%` }} /><span className="absolute inset-0 opacity-20" style={{ backgroundImage: rootProgress > 0 && rootProgress < 100 ? "repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(255,255,255,.55) 6px, rgba(255,255,255,.55) 8px)" : undefined }} /><span className="relative z-10 flex h-full flex-col justify-center truncate px-3 text-xs font-semibold leading-tight text-foreground sm:text-sm">{title(root)}<span className="mt-0.5 text-[10px] font-normal opacity-75">{rootProgress}% completado</span></span></button> })}</div>
        </div>
        <div className="mt-4 flex flex-col gap-0">{roots.filter((root) => expandedRoots.has(root.id)).map((root) => renderItem(root))}</div>
      </CardContent>
    </Card>
    <Dialog open={Boolean(selected)} onOpenChange={(value) => { if (!value) setSelected(null) }}><DialogContent><DialogHeader><DialogTitle>{selected ? title(selected) : "Completar ítem"}</DialogTitle><DialogDescription>{selected ? description(selected) : ""}</DialogDescription></DialogHeader>{selected && <div className="flex flex-col gap-4"><p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Para completar este ítem, indica la fecha y agrega un comentario o evidencia.</p><div className="flex flex-col gap-2"><Label htmlFor="checklist-date"><CalendarDays className="mr-1 inline size-4" />Fecha de cumplimiento *</Label><Input id="checklist-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canEdit || saving} /></div><div className="flex flex-col gap-2"><Label htmlFor="checklist-comment"><MessageSquare className="mr-1 inline size-4" />Comentario / evidencia *</Label><Textarea id="checklist-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Agrega evidencia o comentarios..." disabled={!canEdit || saving} /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button><Button disabled={!canEdit || saving || !selected || !date || !comment.trim()} onClick={() => selected && void persist(selected, true, comment, date)}><Check data-icon="inline-start" />Completar</Button></DialogFooter></DialogContent></Dialog>
  </>
}
