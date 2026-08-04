"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { UnverifiedContactsService } from "@/lib/services/unverified-contacts-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Upload, MoreHorizontal, Loader2, Search } from "lucide-react"
import { DICT_LANG_UNVERIFIED_CONTACTS } from "@/lib/translations/unverified-contacts"
import { toast } from "@/components/ui/use-toast"
import { UnverifiedContactForm } from "./unverified-contact-form"
import { UnverifiedContactsImport } from "./unverified-contacts-import"

interface UnverifiedContact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name: string
  position?: string
  industry_id?: string
  country_id?: string
  source: string
  status: "NEW" | "CONTACTED" | "GRADUATED" | "DISCARDED"
  created_at: string
  updated_at: string
}

interface FilterState {
  source: string
  status: string
  industry: string
}

export function UnverifiedContactsManager() {
  const { t, language } = useTranslations()
  const dict = DICT_LANG_UNVERIFIED_CONTACTS

  // State
  const [contacts, setContacts] = useState<UnverifiedContact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<UnverifiedContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({ source: "", status: "", industry: "" })
  const [selectedContact, setSelectedContact] = useState<UnverifiedContact | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadContacts()
    loadIndustries()
  }, [])

  // Filter contacts
  useEffect(() => {
    let result = contacts

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.company_name.toLowerCase().includes(search),
      )
    }

    if (filters.source) result = result.filter((c) => c.source === filters.source)
    if (filters.status) result = result.filter((c) => c.status === filters.status)
    if (filters.industry) result = result.filter((c) => c.industry_id === filters.industry)

    setFilteredContacts(result)
  }, [contacts, searchTerm, filters])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await UnverifiedContactsService.getContacts()
      setContacts(data)
    } catch (error) {
      console.error("[v0] Error loading unverified contacts:", error)
      toast({
        title: dict["unverified_contacts.error.loading"][language],
        description: "La tabla unverified_contacts podría no estar creada. Por favor, ejecuta el script SQL.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadIndustries = async () => {
    try {
      const { data } = await supabase.from("industries").select("id, name").eq("is_active", true)
      setIndustries(data || [])
    } catch (error) {
      console.error("[v0] Error loading industries:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setIsSaving(true)
      const { error } = await supabase.from("unverified_contacts").delete().eq("id", id)

      if (error) throw error
      setContacts(contacts.filter((c) => c.id !== id))
      toast({
        title: dict["unverified_contacts.success.deleted"][language],
      })
      setDeleteConfirm(null)
    } catch (error) {
      console.error("[v0] Error deleting contact:", error)
      toast({
        title: dict["unverified_contacts.error.deleting"][language],
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePromote = async (contact: UnverifiedContact) => {
    try {
      setIsSaving(true)
      // Create new official contact
      const { data: newContact, error: createError } = await supabase
        .from("contacts")
        .insert([
          {
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone || null,
            position: contact.position || null,
            department: "General",
          },
        ])
        .select("id")

      if (createError) throw createError

      // Delete from unverified
      const { error: deleteError } = await supabase.from("unverified_contacts").delete().eq("id", contact.id)

      if (deleteError) throw deleteError

      setContacts(contacts.filter((c) => c.id !== contact.id))
      toast({
        title: dict["unverified_contacts.success.promoted"][language],
      })
    } catch (error) {
      console.error("[v0] Error promoting contact:", error)
      toast({
        title: "Error",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedContact(null)
    loadContacts()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800",
      CONTACTED: "bg-yellow-100 text-yellow-800",
      GRADUATED: "bg-green-100 text-green-800",
      DISCARDED: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      BULK_IMPORT: "bg-purple-100 text-purple-800",
      WEB_FORM: "bg-blue-100 text-blue-800",
      EVENT: "bg-orange-100 text-orange-800",
    }
    return colors[source] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      NEW: dict["unverified_contacts.status.new"][language],
      CONTACTED: dict["unverified_contacts.status.contacted"][language],
      GRADUATED: dict["unverified_contacts.status.graduated"][language],
      DISCARDED: dict["unverified_contacts.status.discarded"][language],
    }
    return statusMap[status] || status
  }

  const getSourceLabel = (source: string) => {
    const sourceMap: Record<string, string> = {
      BULK_IMPORT: dict["unverified_contacts.source.bulk_import"][language],
      WEB_FORM: dict["unverified_contacts.source.web_form"][language],
      EVENT: dict["unverified_contacts.source.event"][language],
    }
    return sourceMap[source] || source
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{dict["unverified_contacts.title"][language]}</h2>
          <p className="text-sm text-gray-600">{dict["unverified_contacts.description"][language]}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {dict["unverified_contacts.button.import"][language]}
          </Button>
          <Button
            onClick={() => {
              setSelectedContact(null)
              setIsFormOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {dict["unverified_contacts.button.new"][language]}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={dict["unverified_contacts.search.placeholder"][language]}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={dict["unverified_contacts.filter.source"][language]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{dict["unverified_contacts.filter.all"][language]}</SelectItem>
                <SelectItem value="BULK_IMPORT">{dict["unverified_contacts.source.bulk_import"][language]}</SelectItem>
                <SelectItem value="WEB_FORM">{dict["unverified_contacts.source.web_form"][language]}</SelectItem>
                <SelectItem value="EVENT">{dict["unverified_contacts.source.event"][language]}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={dict["unverified_contacts.filter.status"][language]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{dict["unverified_contacts.filter.all"][language]}</SelectItem>
                <SelectItem value="NEW">{dict["unverified_contacts.status.new"][language]}</SelectItem>
                <SelectItem value="CONTACTED">{dict["unverified_contacts.status.contacted"][language]}</SelectItem>
                <SelectItem value="GRADUATED">{dict["unverified_contacts.status.graduated"][language]}</SelectItem>
                <SelectItem value="DISCARDED">{dict["unverified_contacts.status.discarded"][language]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-semibold text-gray-900">{dict["unverified_contacts.empty.title"][language]}</p>
              <p className="text-sm text-gray-600 mb-4">{dict["unverified_contacts.empty.description"][language]}</p>
              <Button
                onClick={() => setIsFormOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {dict["unverified_contacts.button.new"][language]}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict["unverified_contacts.table.full_name"][language]}</TableHead>
                  <TableHead>{dict["unverified_contacts.table.contact"][language]}</TableHead>
                  <TableHead>{dict["unverified_contacts.table.company_position"][language]}</TableHead>
                  <TableHead>{dict["unverified_contacts.table.source"][language]}</TableHead>
                  <TableHead>{dict["unverified_contacts.table.status"][language]}</TableHead>
                  <TableHead className="w-12">{dict["unverified_contacts.table.actions"][language]}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <span className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{contact.email}</div>
                        {contact.phone && <div className="text-gray-600">{contact.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{contact.company_name}</div>
                        {contact.position && <div className="text-gray-600">{contact.position}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSourceColor(contact.source)}>{getSourceLabel(contact.source)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contact.status)}>{getStatusLabel(contact.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContact(contact)
                              setIsFormOpen(true)
                            }}
                          >
                            {dict["unverified_contacts.action.edit"][language]}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePromote(contact)}>
                            {dict["unverified_contacts.action.promote"][language]}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(contact.id)}
                            className="text-red-600"
                          >
                            {dict["unverified_contacts.action.delete"][language]}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {selectedContact
                ? dict["unverified_contacts.form.title.edit"][language]
                : dict["unverified_contacts.form.title.new"][language]}
            </SheetTitle>
          </SheetHeader>
          <UnverifiedContactForm
            contact={selectedContact || undefined}
            industries={industries}
            onSuccess={handleFormSuccess}
          />
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dict["unverified_contacts.import.title"][language]}</DialogTitle>
          </DialogHeader>
          <UnverifiedContactsImport onSuccess={() => {
            setIsImportOpen(false)
            loadContacts()
          }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>{dict["unverified_contacts.confirm.delete"][language]}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {dict["unverified_contacts.action.delete"][language]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
