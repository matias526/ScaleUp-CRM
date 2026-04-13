-- Insert translations for Contacts module in Spanish, English, and Portuguese

-- Basic Form Labels
INSERT INTO translations (language_code, translation_key, translation_value) VALUES
('es', 'contacts.form.firstName', 'Nombre'),
('en', 'contacts.form.firstName', 'First Name'),
('pt', 'contacts.form.firstName', 'Primeiro Nome'),

('es', 'contacts.form.lastName', 'Apellido'),
('en', 'contacts.form.lastName', 'Last Name'),
('pt', 'contacts.form.lastName', 'Sobrenome'),

('es', 'contacts.form.email', 'Email'),
('en', 'contacts.form.email', 'Email'),
('pt', 'contacts.form.email', 'Email'),

('es', 'contacts.form.phone', 'Teléfono'),
('en', 'contacts.form.phone', 'Phone'),
('pt', 'contacts.form.phone', 'Telefone'),

('es', 'contacts.form.position', 'Posición'),
('en', 'contacts.form.position', 'Position'),
('pt', 'contacts.form.position', 'Posição'),

('es', 'contacts.form.department', 'Departamento'),
('en', 'contacts.form.department', 'Department'),
('pt', 'contacts.form.department', 'Departamento'),

('es', 'contacts.form.linkedUser', 'Usuario Vinculado'),
('en', 'contacts.form.linkedUser', 'Linked User'),
('pt', 'contacts.form.linkedUser', 'Usuário Vinculado'),

('es', 'contacts.form.preferredLanguage', 'Idioma Preferido'),
('en', 'contacts.form.preferredLanguage', 'Preferred Language'),
('pt', 'contacts.form.preferredLanguage', 'Idioma Preferido'),

('es', 'contacts.form.techCompany', 'Empresa Tech'),
('en', 'contacts.form.techCompany', 'Tech Company'),
('pt', 'contacts.form.techCompany', 'Empresa Tech'),

('es', 'contacts.form.partner', 'Socio'),
('en', 'contacts.form.partner', 'Partner'),
('pt', 'contacts.form.partner', 'Parceiro'),

('es', 'contacts.form.linkedinUrl', 'URL de LinkedIn'),
('en', 'contacts.form.linkedinUrl', 'LinkedIn URL'),
('pt', 'contacts.form.linkedinUrl', 'URL do LinkedIn'),

('es', 'contacts.form.notes', 'Notas'),
('en', 'contacts.form.notes', 'Notes'),
('pt', 'contacts.form.notes', 'Notas'),

-- Section Titles
('es', 'contacts.form.section.basic', 'Información Básica'),
('en', 'contacts.form.section.basic', 'Basic Information'),
('pt', 'contacts.form.section.basic', 'Informações Básicas'),

('es', 'contacts.form.section.basicDescription', 'Ingrese la información básica del contacto'),
('en', 'contacts.form.section.basicDescription', 'Enter the contact\'s basic information'),
('pt', 'contacts.form.section.basicDescription', 'Insira as informações básicas do contato'),

('es', 'contacts.form.section.professional', 'Información Profesional'),
('en', 'contacts.form.section.professional', 'Professional Information'),
('pt', 'contacts.form.section.professional', 'Informações Profissionais'),

('es', 'contacts.form.section.professionalDescription', 'Ingrese la información profesional del contacto'),
('en', 'contacts.form.section.professionalDescription', 'Enter the contact\'s professional information'),
('pt', 'contacts.form.section.professionalDescription', 'Insira as informações profissionais do contato'),

('es', 'contacts.form.section.relationships', 'Relaciones'),
('en', 'contacts.form.section.relationships', 'Relationships'),
('pt', 'contacts.form.section.relationships', 'Relacionamentos'),

('es', 'contacts.form.section.relationshipsDescription', 'Vincula el contacto con usuarios y compañías'),
('en', 'contacts.form.section.relationshipsDescription', 'Link the contact to users and companies'),
('pt', 'contacts.form.section.relationshipsDescription', 'Vincule o contato a usuários e empresas'),

-- Placeholders
('es', 'contacts.placeholder.enterFirstName', 'Ej: Juan'),
('en', 'contacts.placeholder.enterFirstName', 'E.g: John'),
('pt', 'contacts.placeholder.enterFirstName', 'Ex: João'),

('es', 'contacts.placeholder.enterLastName', 'Ej: García'),
('en', 'contacts.placeholder.enterLastName', 'E.g: Smith'),
('pt', 'contacts.placeholder.enterLastName', 'Ex: Silva'),

('es', 'contacts.placeholder.enterEmail', 'juan@example.com'),
('en', 'contacts.placeholder.enterEmail', 'john@example.com'),
('pt', 'contacts.placeholder.enterEmail', 'joao@example.com'),

('es', 'contacts.placeholder.enterPhone', '+34 123 456 789'),
('en', 'contacts.placeholder.enterPhone', '+1 123 456 7890'),
('pt', 'contacts.placeholder.enterPhone', '+55 11 98765-4321'),

('es', 'contacts.placeholder.enterPosition', 'Ej: Gerente de Ventas'),
('en', 'contacts.placeholder.enterPosition', 'E.g: Sales Manager'),
('pt', 'contacts.placeholder.enterPosition', 'Ex: Gerente de Vendas'),

('es', 'contacts.placeholder.enterNotes', 'Agregue notas adicionales...'),
('en', 'contacts.placeholder.enterNotes', 'Add additional notes...'),
('pt', 'contacts.placeholder.enterNotes', 'Adicione notas adicionais...'),

-- Combobox and Select labels
('es', 'contacts.userCombobox.placeholder', 'Seleccionar usuario...'),
('en', 'contacts.userCombobox.placeholder', 'Select user...'),
('pt', 'contacts.userCombobox.placeholder', 'Selecionar usuário...'),

('es', 'contacts.userCombobox.search', 'Buscar usuario...'),
('en', 'contacts.userCombobox.search', 'Search user...'),
('pt', 'contacts.userCombobox.search', 'Pesquisar usuário...'),

('es', 'contacts.form.selectUser', 'Seleccionar usuario'),
('en', 'contacts.form.selectUser', 'Select a user'),
('pt', 'contacts.form.selectUser', 'Selecionar um usuário'),

('es', 'contacts.form.selectTechCompany', 'Seleccionar empresa tech'),
('en', 'contacts.form.selectTechCompany', 'Select tech company'),
('pt', 'contacts.form.selectTechCompany', 'Selecionar empresa tech'),

('es', 'contacts.form.selectPartner', 'Seleccionar socio'),
('en', 'contacts.form.selectPartner', 'Select partner'),
('pt', 'contacts.form.selectPartner', 'Selecionar parceiro'),

('es', 'contacts.form.optional', '(Opcional)'),
('en', 'contacts.form.optional', '(Optional)'),
('pt', 'contacts.form.optional', '(Opcional)'),

-- Department values
('es', 'department.sales', 'Ventas'),
('en', 'department.sales', 'Sales'),
('pt', 'department.sales', 'Vendas'),

('es', 'department.engineering', 'Ingeniería'),
('en', 'department.engineering', 'Engineering'),
('pt', 'department.engineering', 'Engenharia'),

('es', 'department.marketing', 'Marketing'),
('en', 'department.marketing', 'Marketing'),
('pt', 'department.marketing', 'Marketing'),

('es', 'department.operations', 'Operaciones'),
('en', 'department.operations', 'Operations'),
('pt', 'department.operations', 'Operações'),

('es', 'department.finance', 'Finanzas'),
('en', 'department.finance', 'Finance'),
('pt', 'department.finance', 'Financeiro'),

('es', 'department.hr', 'Recursos Humanos'),
('en', 'department.hr', 'Human Resources'),
('pt', 'department.hr', 'Recursos Humanos'),

('es', 'department.executive', 'Ejecutivo'),
('en', 'department.executive', 'Executive'),
('pt', 'department.executive', 'Executivo'),

-- Language values
('es', 'language.spanish', 'Español'),
('en', 'language.spanish', 'Spanish'),
('pt', 'language.spanish', 'Espanhol'),

('es', 'language.english', 'Inglés'),
('en', 'language.english', 'English'),
('pt', 'language.english', 'Inglês'),

('es', 'language.portuguese', 'Portugués'),
('en', 'language.portuguese', 'Portuguese'),
('pt', 'language.portuguese', 'Português'),

-- Page titles and actions
('es', 'contacts.page.title', 'Contactos'),
('en', 'contacts.page.title', 'Contacts'),
('pt', 'contacts.page.title', 'Contatos'),

('es', 'contacts.page.create', 'Crear Contacto'),
('en', 'contacts.page.create', 'Create Contact'),
('pt', 'contacts.page.create', 'Criar Contato'),

('es', 'contacts.page.edit', 'Editar Contacto'),
('en', 'contacts.page.edit', 'Edit Contact'),
('pt', 'contacts.page.edit', 'Editar Contato'),

('es', 'contacts.page.view', 'Ver Contacto'),
('en', 'contacts.page.view', 'View Contact'),
('pt', 'contacts.page.view', 'Ver Contato'),

('es', 'contacts.button.save', 'Guardar'),
('en', 'contacts.button.save', 'Save'),
('pt', 'contacts.button.save', 'Salvar'),

('es', 'contacts.button.cancel', 'Cancelar'),
('en', 'contacts.button.cancel', 'Cancel'),
('pt', 'contacts.button.cancel', 'Cancelar'),

('es', 'contacts.button.delete', 'Eliminar'),
('en', 'contacts.button.delete', 'Delete'),
('pt', 'contacts.button.delete', 'Excluir'),

('es', 'contacts.button.edit', 'Editar'),
('en', 'contacts.button.edit', 'Edit'),
('pt', 'contacts.button.edit', 'Editar'),

('es', 'contacts.button.view', 'Ver'),
('en', 'contacts.button.view', 'View'),
('pt', 'contacts.button.view', 'Ver'),

-- Table columns
('es', 'contacts.table.name', 'Nombre'),
('en', 'contacts.table.name', 'Name'),
('pt', 'contacts.table.name', 'Nome'),

('es', 'contacts.table.email', 'Email'),
('en', 'contacts.table.email', 'Email'),
('pt', 'contacts.table.email', 'Email'),

('es', 'contacts.table.phone', 'Teléfono'),
('en', 'contacts.table.phone', 'Phone'),
('pt', 'contacts.table.phone', 'Telefone'),

('es', 'contacts.table.department', 'Departamento'),
('en', 'contacts.table.department', 'Department'),
('pt', 'contacts.table.department', 'Departamento'),

('es', 'contacts.table.company', 'Empresa'),
('en', 'contacts.table.company', 'Company'),
('pt', 'contacts.table.company', 'Empresa'),

('es', 'contacts.table.actions', 'Acciones'),
('en', 'contacts.table.actions', 'Actions'),
('pt', 'contacts.table.actions', 'Ações'),

-- Messages
('es', 'contacts.message.success.created', 'Contacto creado exitosamente'),
('en', 'contacts.message.success.created', 'Contact created successfully'),
('pt', 'contacts.message.success.created', 'Contato criado com sucesso'),

('es', 'contacts.message.success.updated', 'Contacto actualizado exitosamente'),
('en', 'contacts.message.success.updated', 'Contact updated successfully'),
('pt', 'contacts.message.success.updated', 'Contato atualizado com sucesso'),

('es', 'contacts.message.success.deleted', 'Contacto eliminado exitosamente'),
('en', 'contacts.message.success.deleted', 'Contact deleted successfully'),
('pt', 'contacts.message.success.deleted', 'Contato excluído com sucesso'),

('es', 'contacts.message.error.loading', 'Error al cargar contactos'),
('en', 'contacts.message.error.loading', 'Error loading contacts'),
('pt', 'contacts.message.error.loading', 'Erro ao carregar contatos'),

('es', 'contacts.message.error.creating', 'Error al crear contacto'),
('en', 'contacts.message.error.creating', 'Error creating contact'),
('pt', 'contacts.message.error.creating', 'Erro ao criar contato'),

('es', 'contacts.message.error.updating', 'Error al actualizar contacto'),
('en', 'contacts.message.error.updating', 'Error updating contact'),
('pt', 'contacts.message.error.updating', 'Erro ao atualizar contato'),

('es', 'contacts.message.error.deleting', 'Error al eliminar contacto'),
('en', 'contacts.message.error.deleting', 'Error deleting contact'),
('pt', 'contacts.message.error.deleting', 'Erro ao excluir contato'),

('es', 'contacts.message.confirm.delete', '¿Está seguro de que desea eliminar este contacto?'),
('en', 'contacts.message.confirm.delete', 'Are you sure you want to delete this contact?'),
('pt', 'contacts.message.confirm.delete', 'Tem certeza de que deseja excluir este contato?'),

('es', 'contacts.message.noContacts', 'No hay contactos disponibles'),
('en', 'contacts.message.noContacts', 'No contacts available'),
('pt', 'contacts.message.noContacts', 'Nenhum contato disponível'),

('es', 'contacts.message.loading', 'Cargando contactos...'),
('en', 'contacts.message.loading', 'Loading contacts...'),
('pt', 'contacts.message.loading', 'Carregando contatos...'),

-- Form validation
('es', 'contacts.validation.firstNameRequired', 'El nombre es requerido'),
('en', 'contacts.validation.firstNameRequired', 'First name is required'),
('pt', 'contacts.validation.firstNameRequired', 'O primeiro nome é obrigatório'),

('es', 'contacts.validation.lastNameRequired', 'El apellido es requerido'),
('en', 'contacts.validation.lastNameRequired', 'Last name is required'),
('pt', 'contacts.validation.lastNameRequired', 'O sobrenome é obrigatório'),

('es', 'contacts.validation.emailRequired', 'El email es requerido'),
('en', 'contacts.validation.emailRequired', 'Email is required'),
('pt', 'contacts.validation.emailRequired', 'O email é obrigatório'),

('es', 'contacts.validation.emailInvalid', 'El email no es válido'),
('en', 'contacts.validation.emailInvalid', 'Email is invalid'),
('pt', 'contacts.validation.emailInvalid', 'O email é inválido'),

('es', 'contacts.validation.departmentRequired', 'El departamento es requerido'),
('en', 'contacts.validation.departmentRequired', 'Department is required'),
('pt', 'contacts.validation.departmentRequired', 'O departamento é obrigatório');
