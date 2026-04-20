/**
 * Translation Dictionary for Pulse Templates Module
 * This object contains all translation keys and values for the pulse templates management feature
 * Languages supported: ES (Spanish), EN (English), PT (Portuguese)
 */

export const DICT_LANG_PULSE = {
  // Headers and general
  "pulse.templates_list": {
    es: "Plantillas de Mensaje",
    en: "Message Templates",
    pt: "Modelos de Mensagem",
  },
  "pulse.description": {
    es: "Gestiona templates reutilizables para Pulse en múltiples idiomas con inserción atómica",
    en: "Manage reusable message templates for Pulse in multiple languages with atomic insertion",
    pt: "Gerencie modelos de mensagens reutilizáveis para Pulse em múltiplos idiomas com inserção atômica",
  },
  "pulse.create_template": {
    es: "Crear Template",
    en: "Create Template",
    pt: "Criar Modelo",
  },
  "pulse.edit_template": {
    es: "Editar Template",
    en: "Edit Template",
    pt: "Editar Modelo",
  },

  // Form labels
  "pulse.internal_code": {
    es: "Código Interno",
    en: "Internal Code",
    pt: "Código Interno",
  },
  "pulse.category": {
    es: "Categoría",
    en: "Category",
    pt: "Categoria",
  },
  "pulse.template_name": {
    es: "Nombre del Template",
    en: "Template Name",
    pt: "Nome do Modelo",
  },
  "pulse.template_description": {
    es: "Descripción (opcional)",
    en: "Description (optional)",
    pt: "Descrição (opcional)",
  },
  "pulse.template_content": {
    es: "Contenido del Template",
    en: "Template Content",
    pt: "Conteúdo do Modelo",
  },

  // Form descriptions
  "pulse.internal_code_hint": {
    es: "Ej: WELCOME_TECH_OPP (único, no editable después)",
    en: "E.g.: WELCOME_TECH_OPP (unique, not editable after)",
    pt: "Ex.: WELCOME_TECH_OPP (único, não editável depois)",
  },
  "pulse.name_hint": {
    es: "Un nombre descriptivo para identificar rápidamente el template",
    en: "A descriptive name to quickly identify the template",
    pt: "Um nome descritivo para identificar rapidamente o modelo",
  },
  "pulse.description_hint": {
    es: "Proporciona contexto para otros usuarios",
    en: "Provide context for other users",
    pt: "Forneça contexto para outros usuários",
  },

  // Dialogs and confirmations
  "pulse.delete_template_description": {
    es: "Esta acción no se puede deshacer. El template y todas sus traducciones serán eliminados permanentemente.",
    en: "This action cannot be undone. The template and all its translations will be permanently deleted.",
    pt: "Esta ação não pode ser desfeita. O modelo e todas as suas traduções serão permanentemente excluídos.",
  },
  "pulse.no_templates": {
    es: "No hay templates creados todavía",
    en: "No templates created yet",
    pt: "Nenhum modelo criado ainda",
  },
  "pulse.create_first_template": {
    es: "Crea tu primer template para comenzar",
    en: "Create your first template to get started",
    pt: "Crie seu primeiro modelo para começar",
  },

  // Auto-translation
  "pulse.auto_translate": {
    es: "Auto-Traducir desde Español",
    en: "Auto-Translate from Spanish",
    pt: "Auto-traduzir do Espanhol",
  },
  "pulse.auto_translate_filled": {
    es: "Primero completa el contenido en español",
    en: "First complete the content in Spanish",
    pt: "Primeiro complete o conteúdo em espanhol",
  },

  // Language tabs
  "pulse.spanish": {
    es: "Español (ES)",
    en: "Spanish (ES)",
    pt: "Espanhol (ES)",
  },
  "pulse.english": {
    es: "English (EN)",
    en: "English (EN)",
    pt: "Inglês (EN)",
  },
  "pulse.portuguese": {
    es: "Português (PT)",
    en: "Portuguese (PT)",
    pt: "Português (PT)",
  },

  // Field labels for each language
  "pulse.display_name": {
    es: "Nombre Mostrable",
    en: "Display Name",
    pt: "Nome de Exibição",
  },
  "pulse.subject": {
    es: "Asunto",
    en: "Subject",
    pt: "Assunto",
  },
  "pulse.content": {
    es: "Contenido",
    en: "Content",
    pt: "Conteúdo",
  },

  // Placeholders
  "pulse.display_name_placeholder_es": {
    es: "Ej: Bienvenida Oportunidad Tech",
    en: "E.g.: Welcome Tech Opportunity",
    pt: "Ex.: Bem-vindo Oportunidade Tech",
  },
  "pulse.subject_placeholder_es": {
    es: "Ej: Nueva Oportunidad {{opportunity_name}}",
    en: "E.g.: New Opportunity {{opportunity_name}}",
    pt: "Ex.: Nova Oportunidade {{opportunity_name}}",
  },
  "pulse.display_name_placeholder_en": {
    es: "E.g.: Welcome Tech Opportunity",
    en: "E.g.: Welcome Tech Opportunity",
    pt: "Ex.: Welcome Tech Opportunity",
  },
  "pulse.subject_placeholder_en": {
    es: "E.g.: New Opportunity {{opportunity_name}}",
    en: "E.g.: New Opportunity {{opportunity_name}}",
    pt: "E.g.: New Opportunity {{opportunity_name}}",
  },

  // Variables and formatting
  "pulse.variables": {
    es: "Variables disponibles",
    en: "Available variables",
    pt: "Variáveis disponíveis",
  },
  "pulse.formatting_help": {
    es: "Usa [B]bold[/B], [I]italic[/I], [U]underline[/U] para formatear. O usa el dropdown de variables.",
    en: "Use [B]bold[/B], [I]italic[/I], [U]underline[/U] to format. Or use the variables dropdown.",
    pt: "Use [B]bold[/B], [I]italic[/I], [U]underline[/U] para formatar. Ou use o menu suspenso de variáveis.",
  },

  // Common actions (reusable)
  "common.create": {
    es: "Crear",
    en: "Create",
    pt: "Criar",
  },
  "common.save": {
    es: "Guardar",
    en: "Save",
    pt: "Guardar",
  },
  "common.cancel": {
    es: "Cancelar",
    en: "Cancel",
    pt: "Cancelar",
  },
  "common.delete": {
    es: "Eliminar",
    en: "Delete",
    pt: "Excluir",
  },
  "common.edit": {
    es: "Editar",
    en: "Edit",
    pt: "Editar",
  },
  "common.copy": {
    es: "Copiar",
    en: "Copy",
    pt: "Copiar",
  },
  "common.confirm_delete": {
    es: "¿Confirmar eliminación?",
    en: "Confirm deletion?",
    pt: "Confirmar exclusão?",
  },
}
