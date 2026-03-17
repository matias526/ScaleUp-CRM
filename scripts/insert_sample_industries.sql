-- Insertar industrias de ejemplo
INSERT INTO public.industries (name, description, is_active, display_order) VALUES
('Tecnología', 'Empresas de software, hardware y servicios tecnológicos', true, 1),
('Finanzas', 'Bancos, seguros, inversiones y servicios financieros', true, 2),
('Salud', 'Hospitales, clínicas, farmacéuticas y dispositivos médicos', true, 3),
('Educación', 'Instituciones educativas y servicios de formación', true, 4),
('Retail', 'Comercio minorista y distribución', true, 5),
('Manufactura', 'Producción industrial y fabricación', true, 6),
('Servicios', 'Servicios profesionales y consultoría', true, 7),
('Energía', 'Petróleo, gas, energías renovables', true, 8),
('Inmobiliario', 'Desarrollo, gestión y servicios inmobiliarios', true, 9),
('Transporte', 'Logística, transporte y distribución', true, 10),
('Telecomunicaciones', 'Servicios de comunicaciones y redes', true, 11),
('Media y Entretenimiento', 'Medios de comunicación, entretenimiento y publicidad', true, 12),
('Agricultura', 'Agricultura, ganadería y productos alimentarios', true, 13),
('Construcción', 'Construcción e ingeniería civil', true, 14),
('Consultoría', 'Servicios de consultoría empresarial', true, 15),
('Gobierno', 'Instituciones gubernamentales y servicios públicos', true, 16),
('Sin fines de lucro', 'Organizaciones no gubernamentales y fundaciones', true, 17),
('Otros', 'Otras industrias no especificadas', true, 18)
ON CONFLICT (name) DO NOTHING;
