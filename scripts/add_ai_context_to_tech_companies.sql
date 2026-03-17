-- Agregar columna ai_context a tech_companies para contexto personalizado de la AI
ALTER TABLE tech_companies 
ADD COLUMN IF NOT EXISTS ai_context TEXT;

-- Agregar comentario explicativo
COMMENT ON COLUMN tech_companies.ai_context IS 'Contexto personalizado que Mika usará para entender la empresa, su metodología, objetivos y perfil de usuarios. Este contexto se incluye en todas las conversaciones.';

-- Ejemplo de contexto para ScaleUp (puedes editarlo después)
UPDATE tech_companies 
SET ai_context = 'ScaleUp es una consultora especializada en implementación y optimización de tecnologías para empresas en crecimiento.

Metodología de trabajo:
- Enfoque consultivo y personalizado
- Implementación práctica y orientada a resultados
- Acompañamiento continuo en la adopción de tecnología
- Capacitación hands-on para equipos

Perfil de usuarios que consultan:
- Gerentes y directores de empresas en crecimiento
- Equipos técnicos que necesitan implementar nuevas soluciones
- Partners que buscan información para sus clientes
- Tomadores de decisión evaluando tecnologías

Objetivo de las consultas:
- Entender capacidades y limitaciones de tecnologías
- Obtener guías prácticas de implementación
- Resolver dudas técnicas específicas
- Comparar opciones y tomar decisiones informadas

Tono esperado en las respuestas:
- Profesional pero accesible
- Práctico y orientado a la acción
- Claro y sin jerga innecesaria
- Enfocado en el valor de negocio'
WHERE name = 'ScaleUp' OR code = 'SCALEUP';
