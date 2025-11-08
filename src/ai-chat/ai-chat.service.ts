import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DiagramService } from '../diagram/diagram.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiChatService {
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private diagramService: DiagramService,
  ) {
    const apiKey = this.configService.get('CLAUDE_API_KEY');
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateUMLFromPrompt(prompt: string, diagramId: string, userId: string) {
    try {
      // Create a detailed prompt for UML generation
      const systemPrompt = `Eres un experto arquitecto de software especializado en diseño de sistemas y diagramas UML. Tu tarea es analizar la solicitud del usuario y generar un diagrama de clases UML completo y profesional.

ANALIZA el dominio del negocio mencionado (farmacia, ferretería, restaurante, hospital, etc.) y crea las clases necesarias con sus atributos y relaciones apropiadas.

IMPORTANTE: Devuelve SOLAMENTE JSON válido sin formato markdown, bloques de código o texto adicional.

El JSON debe seguir exactamente esta estructura:
{
  "name": "Nombre del Sistema",
  "classes": [
    {
      "id": "cls_nombreclase",
      "name": "NombreClase",
      "position": { "x": 100, "y": 100 },
      "attributes": [
        {
          "id": "attr_1",
          "name": "nombreAtributo",
          "type": "String|Long|Integer|BigDecimal|LocalDate|LocalDateTime|Boolean",
          "stereotype": "id|fk",
          "nullable": false,
          "unique": true
        }
      ],
      "methods": [],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "sourceClassId": "cls_clase1",
      "targetClassId": "cls_clase2",
      "type": "ASSOCIATION|AGGREGATION|COMPOSITION|INHERITANCE|DEPENDENCY|OneToOne|OneToMany|ManyToOne|ManyToMany",
      "name": "nombreRelacion",
      "multiplicity": "1:1|1:*|*:*|0..1:1..*"
    }
  ]
}

REGLAS IMPORTANTES:
1. Analiza el contexto del negocio y crea entre 3-6 clases relevantes
2. SIEMPRE incluir atributo "id" como primer atributo de cada clase con: type: "Long", stereotype: "id", nullable: false, unique: true
3. Usa nombres descriptivos en español si el usuario habla español
4. Tipos de datos apropiados: String, Long, Integer, BigDecimal (para precios/dinero), LocalDate, LocalDateTime, Boolean
5. Posiciona clases en cuadrícula: incrementa x por 300, y por 250
6. NO GENERAR MÉTODOS - el array "methods" siempre debe estar vacío []
7. Crea relaciones lógicas entre clases usando los tipos apropiados
8. Para cada dominio considera:
   - FARMACIA: Medicamento, Cliente, Venta, Proveedor, Receta
   - FERRETERÍA: Producto, Cliente, Venta, Proveedor, Categoría
   - RESTAURANTE: Plato, Pedido, Cliente, Mesa, Empleado
   - HOSPITAL: Paciente, Doctor, Cita, Tratamiento, Habitación
   - ESCUELA: Estudiante, Profesor, Curso, Materia, Calificación

TIPOS DE RELACIONES:
- ASSOCIATION: Relación simple entre clases
- AGGREGATION: El "todo" puede existir sin las "partes"
- COMPOSITION: El "todo" contiene las "partes" completamente
- INHERITANCE: Herencia entre clases
- DEPENDENCY: Una clase usa a otra temporalmente
- OneToMany/ManyToOne: Relaciones de cardinalidad específica
- ManyToMany: Relaciones muchos a muchos

GENERACIÓN DE FOREIGN KEYS (FK):
- Para relaciones OneToMany: agregar FK en el lado "many" con stereotype="fk", type="Long"
- Para relaciones AGGREGATION: agregar FK en la clase contenida
- Para relaciones COMPOSITION: agregar FK con nullable=false
- El nombre del FK debe ser: nombreClaseReferenciadaId (ejemplo: "estudianteId", "cursoId")

MULTIPLICIDAD (siempre incluir):
- "1:1" = uno a uno
- "1:*" = uno a muchos
- "*:*" = muchos a muchos
- "0..1:1..*" = opcional a uno o más`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nSolicitud del usuario: ${prompt}\n\nGenera un modelo UML completo y profesional basado en esta solicitud.`
          }
        ],
      });

      if (!message.content || message.content.length === 0) {
        throw new Error('Invalid response from Claude API');
      }

      const generatedText = message.content[0].type === 'text' ? message.content[0].text : '';
      console.log('📝 Respuesta de Claude:', generatedText.substring(0, 200));

      // Clean the response and extract JSON
      let cleanedResponse = generatedText.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to extract JSON if it's embedded in text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      let umlModel;
      try {
        umlModel = JSON.parse(cleanedResponse);
        console.log('✅ JSON parseado exitosamente. Clases:', umlModel.classes?.length);
      } catch (parseError) {
        console.error('❌ Error parseando JSON de Gemini:', parseError.message);
        console.error('Respuesta limpia:', cleanedResponse.substring(0, 300));
        // Fallback to a template model
        console.log('🔄 Usando modelo de fallback para:', prompt);
        umlModel = this.generateFallbackModel(prompt);
      }

      // Validate and ensure the model has the required structure
      umlModel = this.validateAndFixModel(umlModel);

      // Log the AI generation activity
      await this.prisma.diagramActivity.create({
        data: {
          action: 'AI_GENERATION' as any,
          changes: {
            prompt,
            generatedModel: umlModel,
            aiResponse: cleanedResponse,
          },
          userId,
          diagramId,
        },
      });

      return {
        success: true,
        model: umlModel,
        message: 'UML model generated successfully with Claude AI (Haiku)',
      };
    } catch (error) {
      console.error('Error generating UML model with Claude:', error);

      // Fallback to template model if AI fails
      const fallbackModel = this.generateFallbackModel(prompt);

      // Still log the attempt
      await this.prisma.diagramActivity.create({
        data: {
          action: 'AI_GENERATION_FALLBACK' as any,
          changes: {
            prompt,
            error: error.message,
            generatedModel: fallbackModel,
          },
          userId,
          diagramId,
        },
      });

      return {
        success: true,
        model: fallbackModel,
        message: 'UML model generated using fallback (AI temporarily unavailable)',
      };
    }
  }

  private generateGenericModel(prompt: string) {
    return {
      name: 'Generated Model',
      classes: [
        {
          id: 'cls_entity',
          name: 'Entity',
          position: { x: 200, y: 200 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_3', name: 'createdAt', type: 'LocalDateTime', nullable: false, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
      ],
      relations: [],
    };
  }

  private validateAndFixModel(model: any): any {
    // Ensure the model has the required structure
    if (!model.name) {
      model.name = 'Generated System';
    }

    if (!Array.isArray(model.classes)) {
      model.classes = [];
    }

    if (!Array.isArray(model.relations)) {
      model.relations = [];
    }

    // Validate each class
    model.classes = model.classes.map((cls: any, index: number) => {
      if (!cls.id) cls.id = `cls_${index + 1}`;
      if (!cls.name) cls.name = `Class${index + 1}`;
      if (!cls.position) cls.position = { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 250 };
      if (!Array.isArray(cls.attributes)) cls.attributes = [];
      if (!Array.isArray(cls.methods)) cls.methods = [];
      if (!Array.isArray(cls.stereotypes)) cls.stereotypes = ['entity'];

      // Ensure each class has an ID attribute
      const hasIdAttribute = cls.attributes.some((attr: any) => attr.stereotype === 'id');
      if (!hasIdAttribute) {
        cls.attributes.unshift({
          id: `attr_${cls.id}_id`,
          name: 'id',
          type: 'Long',
          stereotype: 'id',
          nullable: false,
          unique: true
        });
      }

      return cls;
    });

    return model;
  }

  private generateFallbackModel(prompt: string): any {
    return this.generateGenericModel(prompt);
  }

  async chatWithAI(message: string, diagramId?: string, userId?: string) {
    try {
      let diagramContext = null;

      // Obtener el diagrama JSON si se proporciona diagramId
      if (diagramId && userId) {
        try {
          const diagram = await this.diagramService.getDiagramById(diagramId, userId);
          diagramContext = diagram.data;
          console.log('📊 Diagrama obtenido para contexto:', diagramId);
        } catch (error) {
          console.log('⚠️ No se pudo obtener el diagrama, continuando sin contexto');
        }
      }

      // Detectar si el usuario está solicitando creación o modificación de diagrama
      const lowerMessage = message.toLowerCase();
      const diagramKeywords = [
        'crear', 'diseñar', 'generar', 'construir', 'hacer', 'modelar', 'armar',
        'create', 'design', 'build', 'generate', 'make', 'construct', 'model',
        'agregar', 'añadir', 'modificar', 'actualizar', 'cambiar', 'editar', 'eliminar', 'quitar',
        'add', 'modify', 'update', 'change', 'edit', 'delete', 'remove',
        'sistema', 'diagrama', 'modelo', 'esquema', 'clases', 'clase',
        'system', 'diagram', 'schema', 'classes', 'class',
        'relacion', 'relación', 'relation', 'relationship',
        'agregacion', 'agregación', 'aggregation',
        'composicion', 'composición', 'composition',
        'herencia', 'inheritance', 'extends',
        'asociacion', 'asociación', 'association',
        'dependencia', 'dependency',
        'atributo', 'attribute', 'campo', 'field',
        'metodo', 'método', 'method', 'funcion', 'función', 'function'
      ];

      const isDiagramRequest = diagramKeywords.some(keyword => lowerMessage.includes(keyword));

      // Si es una solicitud de diagrama, generar el modelo UML directamente
      if (isDiagramRequest && diagramId && userId) {
        console.log('🎨 Detectada solicitud de diagrama, generando modelo UML...');

        const systemPrompt = `Eres un experto arquitecto de software especializado en diseño de sistemas y diagramas UML. Tu tarea es analizar la solicitud del usuario y generar un diagrama de clases UML completo y profesional.

${diagramContext && Object.keys(diagramContext).length > 0 ? `CONTEXTO DEL DIAGRAMA ACTUAL:
El usuario ya tiene un diagrama con la siguiente estructura:
${JSON.stringify(diagramContext, null, 2)}

IMPORTANTE PARA MODIFICACIONES:
- Si el usuario pide AGREGAR algo nuevo (clase, atributo, relación): MANTÉN todo lo existente y AGREGA lo nuevo
- Si el usuario pide CAMBIAR/MODIFICAR algo existente (cambiar tipo de relación, modificar atributo, etc.): MANTÉN todo lo demás y SOLO modifica lo específicamente mencionado
- Si el usuario pide ELIMINAR algo: MANTÉN todo lo demás y QUITA solo lo mencionado
- Si pide crear un SISTEMA COMPLETAMENTE NUEVO no relacionado con el actual: genera un diagrama nuevo desde cero

EJEMPLOS:
- "cambiar la relación entre Medico e HistorialMedico a agregación" → Mantén todas las clases y relaciones, solo cambia el tipo de esa relación específica a AGGREGATION
- "agregar clase Empleado" → Mantén todo y agrega la nueva clase
- "modificar atributo nombre en Paciente" → Mantén todo y modifica solo ese atributo` : 'No hay diagrama existente. Genera un nuevo diagrama completo desde cero.'}

ANALIZA el dominio del negocio mencionado y crea/modifica las clases necesarias con sus atributos y relaciones apropiadas.

IMPORTANTE: Devuelve SOLAMENTE JSON válido sin formato markdown, bloques de código o texto adicional.

El JSON debe seguir exactamente esta estructura:
{
  "name": "Nombre del Sistema",
  "classes": [
    {
      "id": "cls_nombreclase",
      "name": "NombreClase",
      "position": { "x": 100, "y": 100 },
      "attributes": [
        {
          "id": "attr_1",
          "name": "nombreAtributo",
          "type": "String|Long|Integer|BigDecimal|LocalDate|LocalDateTime|Boolean",
          "stereotype": "id|fk",
          "nullable": false,
          "unique": true
        }
      ],
      "methods": [],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "sourceClassId": "cls_clase1",
      "targetClassId": "cls_clase2",
      "type": "ASSOCIATION|AGGREGATION|COMPOSITION|INHERITANCE|DEPENDENCY|OneToOne|OneToMany|ManyToOne|ManyToMany",
      "name": "nombreRelacion",
      "multiplicity": "1:1|1:*|*:*|0..1:1..*"
    }
  ]
}

REGLAS IMPORTANTES:
1. Analiza el contexto del negocio y crea entre 3-6 clases relevantes
2. SIEMPRE incluir atributo "id" como primer atributo de cada clase con: type: "Long", stereotype: "id", nullable: false, unique: true
3. Usa nombres descriptivos en español si el usuario habla español
4. Tipos de datos apropiados: String, Long, Integer, BigDecimal (para precios/dinero), LocalDate, LocalDateTime, Boolean
5. Posiciona clases en cuadrícula: incrementa x por 300, y por 250
6. NO GENERAR MÉTODOS - el array "methods" siempre debe estar vacío []
7. Crea relaciones lógicas entre clases usando los tipos apropiados

TIPOS DE RELACIONES Y CUANDO USARLAS:
- ASSOCIATION: Relación simple entre clases (ejemplo: Profesor - Curso)
- AGGREGATION: El "todo" puede existir sin las "partes" (ejemplo: Departamento - Empleado, un empleado puede existir sin departamento)
- COMPOSITION: El "todo" contiene las "partes" completamente (ejemplo: Pedido - LineaPedido, las líneas no existen sin el pedido)
- INHERITANCE: Herencia entre clases (ejemplo: Persona → Estudiante, Profesor)
- DEPENDENCY: Una clase usa a otra temporalmente
- OneToMany/ManyToOne: Relaciones de cardinalidad específica
- ManyToMany: Relaciones muchos a muchos

GENERACIÓN DE FOREIGN KEYS (FK):
- Para relaciones OneToMany: agregar FK en el lado "many" (ejemplo: Estudiante 1:N Nota → Nota tiene "estudianteId" con stereotype="fk")
- Para relaciones ManyToOne: agregar FK en el lado source
- Para relaciones AGGREGATION: agregar FK en la clase contenida
- Para relaciones COMPOSITION: agregar FK en la clase contenida con nullable=false
- FK siempre deben tener: type="Long", stereotype="fk", unique=false
- El nombre del FK debe ser: nombreClaseReferenciadaId (ejemplo: "estudianteId", "cursoId", "pedidoId")

MULTIPLICIDAD:
- Formato: "multiplicidadSource:multiplicidadTarget"
- "1:1" = uno a uno
- "1:*" = uno a muchos
- "*:*" = muchos a muchos
- "0..1:1..*" = opcional a uno o más
- Siempre incluir multiplicidad en las relaciones

EJEMPLOS CONCRETOS:

EJEMPLO 1 - ESTUDIANTE Y NOTA (1:N con AGGREGATION):
Clase Estudiante: { id, nombre, email } - sin FK
Clase Nota: { id, valor, materia, estudianteId (stereotype="fk", type="Long") }
Relación: { type: "AGGREGATION", sourceClassId: "cls_estudiante", targetClassId: "cls_nota", multiplicity: "1:*" }

EJEMPLO 2 - ESTUDIANTE Y CURSO (N:M con ASSOCIATION):
Clase Estudiante: { id, nombre, email } - sin FK directo
Clase Curso: { id, nombre, creditos } - sin FK directo
Relación: { type: "ASSOCIATION", sourceClassId: "cls_estudiante", targetClassId: "cls_curso", multiplicity: "*:*" }
NOTA: En implementación real requeriría tabla intermedia

EJEMPLO 3 - PEDIDO Y LINEA PEDIDO (1:N con COMPOSITION):
Clase Pedido: { id, fecha, total } - sin FK
Clase LineaPedido: { id, cantidad, precioUnitario, pedidoId (stereotype="fk", type="Long", nullable=false) }
Relación: { type: "COMPOSITION", sourceClassId: "cls_pedido", targetClassId: "cls_lineapedido", multiplicity: "1:*" }

EJEMPLO 4 - DEPARTAMENTO Y EMPLEADO (1:N con AGGREGATION):
Clase Departamento: { id, nombre } - sin FK
Clase Empleado: { id, nombre, salario, departamentoId (stereotype="fk", type="Long") }
Relación: { type: "AGGREGATION", sourceClassId: "cls_departamento", targetClassId: "cls_empleado", multiplicity: "1:*" }

EJEMPLO 5 - PERSONA Y ESTUDIANTE (HERENCIA):
Clase Persona: { id, nombre, dni }
Clase Estudiante: { id, matricula, carrera }
Relación: { type: "INHERITANCE", sourceClassId: "cls_estudiante", targetClassId: "cls_persona", multiplicity: "" }
NOTA: Estudiante hereda de Persona`;

        const claudeMessage = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\nSolicitud del usuario: ${message}\n\nGenera el modelo UML completo basado en esta solicitud ${diagramContext ? 'y el contexto del diagrama existente' : ''}.`
            }
          ],
        });

        if (!claudeMessage.content || claudeMessage.content.length === 0) {
          throw new Error('Invalid response from Claude API');
        }

        const generatedText = claudeMessage.content[0].type === 'text' ? claudeMessage.content[0].text : '';
        console.log('📝 Respuesta de Claude para diagrama:', generatedText.substring(0, 200));

        // Clean the response and extract JSON
        let cleanedResponse = generatedText.trim();

        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        // Try to extract JSON if it's embedded in text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        let umlModel;
        try {
          umlModel = JSON.parse(cleanedResponse);
          console.log('✅ JSON parseado exitosamente. Clases:', umlModel.classes?.length);
        } catch (parseError) {
          console.error('❌ Error parseando JSON de Claude:', parseError.message);
          console.error('Respuesta limpia:', cleanedResponse.substring(0, 300));
          // Fallback to a template model
          console.log('🔄 Usando modelo de fallback para:', message);
          umlModel = this.generateFallbackModel(message);
        }

        // Validate and ensure the model has the required structure
        umlModel = this.validateAndFixModel(umlModel);

        // Log the AI generation activity
        await this.prisma.diagramActivity.create({
          data: {
            action: 'AI_GENERATION' as any,
            changes: {
              prompt: message,
              generatedModel: umlModel,
              aiResponse: cleanedResponse,
              hadContext: !!diagramContext,
            },
            userId,
            diagramId,
          },
        });

        // Return response with the generated model
        return {
          response: `✨ ${umlModel.name}`,
          suggestions: [
            'Agregar más clases',
            'Modificar atributos',
            'Crear más relaciones',
            'Generar otro sistema'
          ],
          model: umlModel, // Include the generated model in the response
        };
      } else {
        // Respuesta conversacional regular (sin generación de diagrama)
        const systemPrompt = `Eres un consultor experto en UML y arquitecto de software. Ayuda al usuario con sus preguntas sobre diagramas UML y proporciona consejos prácticos. Responde siempre en español de manera concisa.

${diagramContext ? `CONTEXTO DEL DIAGRAMA ACTUAL:
El usuario tiene un diagrama con la siguiente estructura:
${JSON.stringify(diagramContext, null, 2)}

Si el usuario pregunta sobre su diagrama, analiza el contexto actual.` : 'Sin contexto de diagrama actual.'}

IMPORTANTE: Sé conciso pero informativo en tus respuestas.`;

        const claudeMessage = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\nMensaje del usuario: ${message}\n\nProporciona una respuesta útil y práctica.`
            }
          ],
        });

        if (!claudeMessage.content || claudeMessage.content.length === 0) {
          throw new Error('Invalid response from Claude API');
        }

        const aiResponse = claudeMessage.content[0].type === 'text' ? claudeMessage.content[0].text : '';

        return {
          response: aiResponse,
          suggestions: [
            'Crear un sistema de farmacia',
            'Diseñar un e-commerce con productos y pedidos',
            'Modelar un sistema de biblioteca',
            'Generar un blog con posts y comentarios'
          ],
        };
      }
    } catch (error) {
      console.error('Error in AI chat with Claude:', error);
      return {
        response: `Entiendo que quieres saber sobre: "${message}". Déjame ayudarte a crear un diagrama UML para eso. Puedes pedirme que genere diagramas específicos o explicar conceptos UML.`,
        suggestions: [
          'Crear un sistema de farmacia',
          'Diseñar un e-commerce',
          'Modelar una biblioteca',
          'Generar un sistema de blog'
        ],
      };
    }
  }
}