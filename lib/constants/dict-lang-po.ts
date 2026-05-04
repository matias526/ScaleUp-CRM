/**
 * Translation Dictionary for Purchase Orders Module
 * This object contains all translation keys and values for the purchase orders management feature
 * Languages supported: ES (Spanish), EN (English), PT (Portuguese)
 */

export const DICT_LANG_PO = {
  // Sidebar
  "sidebar.orders": {
    es: "Órdenes",
    en: "Orders",
    pt: "Pedidos",
  },

  // List Page
  "po.title": {
    es: "Órdenes de Compra",
    en: "Purchase Orders",
    pt: "Pedidos de Compra",
  },
  "po.listTitle": {
    es: "Órdenes de Compra",
    en: "Purchase Orders",
    pt: "Pedidos de Compra",
  },
  "po.list.noResults": {
    es: "No hay órdenes de compra",
    en: "No purchase orders found",
    pt: "Nenhum pedido de compra encontrado",
  },
  "po.noOrders": {
    es: "No hay órdenes de compra",
    en: "No purchase orders found",
    pt: "Nenhum pedido de compra encontrado",
  },
  "po.list.loading": {
    es: "Cargando órdenes...",
    en: "Loading orders...",
    pt: "Carregando pedidos...",
  },
  "po.errorNotAuthenticated": {
    es: "No estás autenticado. Por favor, inicia sesión.",
    en: "Not authenticated. Please log in.",
    pt: "Não autenticado. Por favor, faça login.",
  },
  "po.errorLoadingOrders": {
    es: "Error al cargar las órdenes de compra.",
    en: "Error loading purchase orders.",
    pt: "Erro ao carregar pedidos de compra.",
  },
  "po.errorLoadingOrder": {
    es: "Error al cargar la orden de compra.",
    en: "Error loading purchase order.",
    pt: "Erro ao carregar pedido de compra.",
  },

  // List Table Headers (both variants for compatibility)
  "po.poNumber": {
    es: "Número de PO",
    en: "PO Number",
    pt: "Número PO",
  },
  "po.table.poNumber": {
    es: "Número de PO",
    en: "PO Number",
    pt: "Número PO",
  },
  "po.partner": {
    es: "Partner",
    en: "Partner",
    pt: "Partner",
  },
  "po.table.partner": {
    es: "Partner",
    en: "Partner",
    pt: "Partner",
  },
  "po.status": {
    es: "Estado",
    en: "Status",
    pt: "Status",
  },
  "po.table.status": {
    es: "Estado",
    en: "Status",
    pt: "Status",
  },
  "po.totalAmount": {
    es: "Monto Total",
    en: "Total Amount",
    pt: "Valor Total",
  },
  "po.table.totalAmount": {
    es: "Monto Total",
    en: "Total Amount",
    pt: "Valor Total",
  },
  "po.date": {
    es: "Fecha",
    en: "Date",
    pt: "Data",
  },
  "po.table.date": {
    es: "Fecha",
    en: "Date",
    pt: "Data",
  },
  "po.actions": {
    es: "Acciones",
    en: "Actions",
    pt: "Ações",
  },
  "po.table.actions": {
    es: "Acciones",
    en: "Actions",
    pt: "Ações",
  },
  "po.view": {
    es: "Ver",
    en: "View",
    pt: "Ver",
  },
  "po.notFound": {
    es: "Orden de compra no encontrada",
    en: "Purchase order not found",
    pt: "Pedido de compra não encontrado",
  },

  // Detail Page Tabs
  "po.tabs.general": {
    es: "General",
    en: "General",
    pt: "Geral",
  },
  "po.tabs.financials": {
    es: "Financiero y Hitos",
    en: "Financials & Milestones",
    pt: "Financeiro e Marcos",
  },
  "po.tabs.logistics": {
    es: "Logística",
    en: "Logistics",
    pt: "Logística",
  },
  "po.tabs.documents": {
    es: "Documentos",
    en: "Documents",
    pt: "Documentos",
  },

  // Detail Page - General Tab
  "po.detail.poNumber": {
    es: "Número de PO",
    en: "PO Number",
    pt: "Número PO",
  },
  "po.detail.status": {
    es: "Estado",
    en: "Status",
    pt: "Status",
  },
  "po.detail.partner": {
    es: "Partner",
    en: "Partner",
    pt: "Partner",
  },
  "po.detail.createdDate": {
    es: "Fecha de Creación",
    en: "Created Date",
    pt: "Data de Criação",
  },
  "po.detail.createdBy": {
    es: "Creado por",
    en: "Created By",
    pt: "Criado por",
  },
  "po.detail.approvedDate": {
    es: "Fecha de Aprobación",
    en: "Approved Date",
    pt: "Data de Aprovação",
  },
  "po.detail.approvedBy": {
    es: "Aprobado por",
    en: "Approved By",
    pt: "Aprovado por",
  },

  // Detail Page - Financials Tab
  "po.detail.subtotal": {
    es: "Subtotal",
    en: "Subtotal",
    pt: "Subtotal",
  },
  "po.detail.shipping": {
    es: "Envío",
    en: "Shipping",
    pt: "Envio",
  },
  "po.detail.total": {
    es: "Total",
    en: "Total",
    pt: "Total",
  },
  "po.detail.milestones": {
    es: "Hitos",
    en: "Milestones",
    pt: "Marcos",
  },
  "po.detail.noMilestones": {
    es: "Sin hitos configurados",
    en: "No milestones configured",
    pt: "Nenhum marco configurado",
  },

  // Detail Page - Logistics Tab
  "po.detail.shipments": {
    es: "Envíos",
    en: "Shipments",
    pt: "Remessas",
  },
  "po.detail.noShipments": {
    es: "Sin envíos registrados",
    en: "No shipments recorded",
    pt: "Nenhuma remessa registrada",
  },

  // Detail Page - Documents Tab
  "po.detail.poDocument": {
    es: "Documento de PO",
    en: "PO Document",
    pt: "Documento PO",
  },
  "po.detail.download": {
    es: "Descargar",
    en: "Download",
    pt: "Baixar",
  },
  "po.detail.preview": {
    es: "Vista Previa",
    en: "Preview",
    pt: "Visualizar",
  },
  "po.detail.noDocuments": {
    es: "Sin documentos",
    en: "No documents",
    pt: "Sem documentos",
  },

  // Status Labels
  "po.status.sent": {
    es: "Enviado",
    en: "Sent",
    pt: "Enviado",
  },
  "po.status.accepted": {
    es: "Aceptado",
    en: "Accepted",
    pt: "Aceito",
  },
  "po.status.pending": {
    es: "Pendiente",
    en: "Pending",
    pt: "Pendente",
  },
  "po.status.approved": {
    es: "Aprobado",
    en: "Approved",
    pt: "Aprovado",
  },
  "po.status.rejected": {
    es: "Rechazado",
    en: "Rejected",
    pt: "Rejeitado",
  },

  // Actions
  "po.action.approve": {
    es: "Aprobar",
    en: "Approve",
    pt: "Aprovar",
  },
  "po.action.reject": {
    es: "Rechazar",
    en: "Reject",
    pt: "Rejeitar",
  },
  "po.action.view": {
    es: "Ver Detalles",
    en: "View Details",
    pt: "Ver Detalhes",
  },
  "po.action.downloadPO": {
    es: "Descargar PO",
    en: "Download PO",
    pt: "Baixar PO",
  },

  // Messages
  "po.message.approveConfirm": {
    es: "¿Está seguro de que desea aprobar esta orden?",
    en: "Are you sure you want to approve this order?",
    pt: "Tem certeza de que deseja aprovar este pedido?",
  },
  "po.message.approveSucess": {
    es: "Orden aprobada correctamente",
    en: "Order approved successfully",
    pt: "Pedido aprovado com sucesso",
  },
  "po.message.approveError": {
    es: "Error al aprobar la orden",
    en: "Error approving order",
    pt: "Erro ao aprovar pedido",
  },
  "po.message.loadingError": {
    es: "Error al cargar las órdenes",
    en: "Error loading orders",
    pt: "Erro ao carregar pedidos",
  },

  // Filter
  "po.filter.all": {
    es: "Todas",
    en: "All",
    pt: "Todos",
  },
  "po.filter.byStatus": {
    es: "Por Estado",
    en: "By Status",
    pt: "Por Status",
  },
  "po.filter.byPartner": {
    es: "Por Partner",
    en: "By Partner",
    pt: "Por Partner",
  },
  "common.success": {
    es: "Éxito",
    en: "Success",
    pt: "Sucesso",
  },
  "common.error": {
    es: "Error",
    en: "Error",
    pt: "Erro",
  },
  "common.cancel": {
    es: "Cancelar",
    en: "Cancel",
    pt: "Cancelar",
  },
  "common.save": {
    es: "Guardar",
    en: "Save",
    pt: "Salvar",
  },
}
