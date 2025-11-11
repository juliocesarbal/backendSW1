"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const diagram_service_1 = require("../diagram/diagram.service");
const sdk_1 = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
let AiChatService = class AiChatService {
    constructor(prisma, configService, diagramService) {
        this.prisma = prisma;
        this.configService = configService;
        this.diagramService = diagramService;
        this.CLAUDE_MODEL_MAIN = 'claude-sonnet-4-5-20250929';
        this.CLAUDE_MODEL_FAST = 'claude-3-5-haiku-20241022';
        this.MaxTokens = 8192;
        const apiKey = this.configService.get('CLAUDE_API_KEY');
        this.anthropic = new sdk_1.default({
            apiKey: apiKey,
        });
    }
    async generateUMLFromPrompt(prompt, diagramId, userId) {
        try {
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
      "multiplicity": {
        "source": "1|0..1|1..*|*|0..*",
        "target": "1|0..1|1..*|*|0..*"
      }
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

MULTIPLICIDAD (FORMATO OBJETO - IMPORTANTE):
La multiplicidad debe ser un objeto con "source" y "target":
- { "source": "1", "target": "1" } = uno a uno
- { "source": "1", "target": "*" } = uno a muchos
- { "source": "*", "target": "1" } = muchos a uno
- { "source": "*", "target": "*" } = muchos a muchos
- { "source": "0..1", "target": "1..*" } = opcional a uno o más
- { "source": "1..*", "target": "1" } = uno o más a uno

RELACIONES MUCHOS A MUCHOS (N:N):
Cuando detectes una relación muchos a muchos:
- DEBES CREAR una clase intermedia explícitamente en el array "classes"
- La clase intermedia debe tener nombre: clase1_clase2 (ejemplo: estudiante_curso, producto_categoria)
- La clase intermedia DEBE tener estos atributos:
  * id: Long con stereotype="id", nullable=false, unique=true
  * clase1Id: Long con stereotype="fk", nullable=false (FK a la primera clase)
  * clase2Id: Long con stereotype="fk", nullable=false (FK a la segunda clase)
- Crear dos relaciones MANY_TO_ONE desde la clase intermedia hacia las dos clases principales
- Ejemplo completo para Estudiante-Curso:
  * Clase "estudiante" con sus atributos
  * Clase "curso" con sus atributos
  * Clase "estudiante_curso" con: id, estudianteId [FK], cursoId [FK]
  * Relación: estudiante_curso → estudiante (MANY_TO_ONE, source="*", target="1")
  * Relación: estudiante_curso → curso (MANY_TO_ONE, source="*", target="1")

CASOS COMUNES DE N:N:
- FARMACIA: Medicamento <-> Proveedor (un medicamento puede tener varios proveedores)
- RESTAURANTE: Plato <-> Ingrediente (un plato tiene varios ingredientes)
- HOSPITAL: Doctor <-> Especialidad (un doctor puede tener varias especialidades)
- ESCUELA: Estudiante <-> Curso (un estudiante toma varios cursos)
- COMERCIO: Producto <-> Categoria (un producto puede estar en varias categorías)`;
            const message = await this.anthropic.messages.create({
                model: this.CLAUDE_MODEL_MAIN,
                max_tokens: this.MaxTokens,
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
            let cleanedResponse = generatedText.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            }
            else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }
            let umlModel;
            try {
                umlModel = JSON.parse(cleanedResponse);
                console.log('✅ JSON parseado exitosamente. Clases:', umlModel.classes?.length);
            }
            catch (parseError) {
                console.error('❌ Error parseando JSON de Gemini:', parseError.message);
                console.error('Respuesta limpia:', cleanedResponse.substring(0, 300));
                console.log('🔄 Usando modelo de fallback para:', prompt);
                umlModel = this.generateFallbackModel(prompt);
            }
            umlModel = this.validateAndFixModel(umlModel);
            await this.prisma.diagramActivity.create({
                data: {
                    action: 'AI_GENERATION',
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
        }
        catch (error) {
            console.error('Error generating UML model with Claude:', error);
            const fallbackModel = this.generateFallbackModel(prompt);
            await this.prisma.diagramActivity.create({
                data: {
                    action: 'AI_GENERATION_FALLBACK',
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
    generateGenericModel(prompt) {
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
    validateAndFixModel(model) {
        if (!model.name) {
            model.name = 'Generated System';
        }
        if (!Array.isArray(model.classes)) {
            model.classes = [];
        }
        if (!Array.isArray(model.relations)) {
            model.relations = [];
        }
        model.classes = model.classes.map((cls, index) => {
            if (!cls.id)
                cls.id = `cls_${index + 1}`;
            if (!cls.name)
                cls.name = `Class${index + 1}`;
            if (!cls.position)
                cls.position = { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 250 };
            if (!Array.isArray(cls.attributes))
                cls.attributes = [];
            if (!Array.isArray(cls.methods))
                cls.methods = [];
            if (!Array.isArray(cls.stereotypes))
                cls.stereotypes = ['entity'];
            const hasIdAttribute = cls.attributes.some((attr) => attr.stereotype === 'id');
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
        const intermediateTableCandidates = new Set();
        const relationsToRemove = new Set();
        const newRelations = [];
        model.classes.forEach((cls) => {
            const clsName = cls.name.toLowerCase();
            if (clsName.includes('_') || clsName.includes('detalle')) {
                const relationsFrom = model.relations.filter((r) => r.sourceClassId === cls.id);
                const relationsTo = model.relations.filter((r) => r.targetClassId === cls.id);
                if (relationsFrom.length + relationsTo.length >= 2) {
                    console.log(`🔍 Potential intermediate table detected: ${cls.name}`);
                    intermediateTableCandidates.add(cls.id);
                }
            }
        });
        intermediateTableCandidates.forEach(intermediateId => {
            const intermediateCls = model.classes.find((c) => c.id === intermediateId);
            if (!intermediateCls)
                return;
            const connectingRelations = model.relations.filter((r) => r.sourceClassId === intermediateId || r.targetClassId === intermediateId);
            if (connectingRelations.length === 2) {
                const rel1 = connectingRelations[0];
                const rel2 = connectingRelations[1];
                let mainClass1Id, mainClass2Id;
                if (rel1.targetClassId === intermediateId) {
                    mainClass1Id = rel1.sourceClassId;
                }
                else {
                    mainClass1Id = rel1.targetClassId;
                }
                if (rel2.targetClassId === intermediateId) {
                    mainClass2Id = rel2.sourceClassId;
                }
                else {
                    mainClass2Id = rel2.targetClassId;
                }
                if (mainClass1Id && mainClass2Id && mainClass1Id !== mainClass2Id) {
                    console.log(`✨ Converting to N:N: ${mainClass1Id} <-> ${mainClass2Id} via ${intermediateCls.name}`);
                    const newRelation = {
                        id: `rel_nn_${mainClass1Id}_${mainClass2Id}`,
                        sourceClassId: mainClass1Id,
                        targetClassId: mainClass2Id,
                        type: 'ManyToMany',
                        name: '',
                        multiplicity: {
                            source: '*',
                            target: '*'
                        },
                        intermediateTable: {
                            id: intermediateId,
                            name: intermediateCls.name,
                            attributes: intermediateCls.attributes?.map((attr) => `${attr.name}: ${attr.type}${attr.stereotype ? ' [' + attr.stereotype.toUpperCase() + ']' : ''}`) || []
                        }
                    };
                    newRelations.push(newRelation);
                    relationsToRemove.add(rel1.id);
                    relationsToRemove.add(rel2.id);
                    intermediateCls._isIntermediateTable = true;
                }
            }
        });
        model.relations = model.relations.filter((r) => !relationsToRemove.has(r.id));
        model.relations.push(...newRelations);
        model.classes = model.classes.filter((c) => !c._isIntermediateTable);
        model.relations = model.relations.map((rel, index) => {
            if (!rel.id)
                rel.id = `rel_${index + 1}`;
            if (!rel.type)
                rel.type = 'ASSOCIATION';
            if (!rel.name)
                rel.name = 'relation';
            if (rel.multiplicity) {
                if (typeof rel.multiplicity === 'string') {
                    const parts = rel.multiplicity.split(':');
                    rel.multiplicity = {
                        source: parts[0] || '',
                        target: parts[1] || ''
                    };
                    console.log(`🔄 Converted multiplicity string "${parts[0] || 'empty'}:${parts[1] || 'empty'}" to object`);
                }
                else if (typeof rel.multiplicity === 'object') {
                    if (rel.multiplicity.source === undefined || rel.multiplicity.source === null) {
                        rel.multiplicity.source = '';
                    }
                    if (rel.multiplicity.target === undefined || rel.multiplicity.target === null) {
                        rel.multiplicity.target = '';
                    }
                }
            }
            else {
                rel.multiplicity = { source: '', target: '' };
            }
            const isSourceMany = rel.multiplicity.source.includes('*') || rel.multiplicity.source === '*';
            const isTargetMany = rel.multiplicity.target.includes('*') || rel.multiplicity.target === '*';
            if (isSourceMany && isTargetMany) {
                console.log(`🔗 Detected many-to-many relationship: ${rel.sourceClassId} <-> ${rel.targetClassId}`);
                if (rel.type === 'ASSOCIATION') {
                    rel.type = 'ManyToMany';
                }
            }
            return rel;
        });
        return model;
    }
    generateFallbackModel(prompt) {
        return this.generateGenericModel(prompt);
    }
    async chatWithAI(message, diagramId, userId, imageBase64) {
        try {
            let diagramContext = null;
            if (diagramId && userId) {
                try {
                    const diagram = await this.diagramService.getDiagramById(diagramId, userId);
                    diagramContext = diagram.data;
                    console.log('📊 Diagrama obtenido para contexto:', diagramId);
                }
                catch (error) {
                    console.log('⚠️ No se pudo obtener el diagrama, continuando sin contexto');
                }
            }
            if (imageBase64 && diagramId && userId) {
                console.log('🖼️ Imagen detectada, analizando diagrama de clases...');
                const imageProcessingStartTime = Date.now();
                try {
                    const base64Match = imageBase64.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
                    if (!base64Match) {
                        throw new Error('Formato de imagen inválido. Debe ser base64 con data URL.');
                    }
                    const mediaType = `image/${base64Match[1]}`;
                    const base64Data = base64Match[2];
                    console.log(`📊 Imagen stats: tipo=${mediaType}, tamaño aprox=${Math.round(base64Data.length / 1024)}KB`);
                    const visionPrompt = `You are an expert in UML diagrams. Analyze this image VERY CAREFULLY and extract ALL information.

CRITICAL - MULTIPLICITY:
On each relationship line, look for small numbers at BOTH ends:
- A number near the START of the line
- A number near the END of the line
These numbers can be: 1, *, 0..1, 1..*, 0..*, 1..1

STEP BY STEP PROCESS:
1. FIRST: Identify each relationship line in the image
2. SECOND: For EACH line, look VERY CAREFULLY for numbers at BOTH ends
3. THIRD: Extract classes and their attributes
4. FOURTH: Generate the JSON

IMPORTANT:
- Return ONLY valid JSON (without triple backticks or additional text)
- If you see a small table IN THE MIDDLE of a dashed line, it is an intermediate table for N:N relationship
- Intermediate table has name like: class1_class2
- NEVER invent multiplicity, ALWAYS look for it in the image

The JSON must follow exactly this structure:
{
  "name": "System Name extracted from image",
  "classes": [
    {
      "id": "cls_classname",
      "name": "ClassName",
      "position": { "x": 100, "y": 100 },
      "attributes": [
        {
          "id": "attr_1",
          "name": "attributeName",
          "type": "String|Long|Integer|BigDecimal|LocalDate|LocalDateTime|Boolean",
          "stereotype": "id|fk",
          "nullable": false,
          "unique": false
        }
      ],
      "methods": [],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "sourceClassId": "cls_class1",
      "targetClassId": "cls_class2",
      "type": "ASSOCIATION|AGGREGATION|COMPOSITION|INHERITANCE|DEPENDENCY|OneToMany|ManyToOne|ManyToMany",
      "name": "relationName",
      "multiplicity": {
        "source": "1|0..1|1..*|*|0..*",
        "target": "1|0..1|1..*|*|0..*"
      }
    }
  ]
}

CRITICAL RULES:
1. Each class MUST have an "id" attribute as first attribute
2. If you see Foreign Keys in the image, mark them with stereotype="fk"
3. Respect exact names you see in the image
4. Correctly identify relationship types by arrows/lines
5. MULTIPLICITY IS THE MOST IMPORTANT - Look for small numbers at both ends of each line:
   - At the START of the line (near source class) = "source"
   - At the END of the line (near target class) = "target"
   - Examples: "1", "*", "0..1", "1..*", "0..*", "*..1"
6. MULTIPLICITY must be object: { "source": "value_at_start", "target": "value_at_end" }
7. If you DO NOT see visible multiplicity in the image, DO NOT invent, use: { "source": "", "target": "" }
8. If you see dashed lines (- - - -), it is probably many-to-many: { "source": "*", "target": "*" }
9. If you see a small table IN THE MIDDLE of a dashed line, it is N:N relationship with intermediate table
10. For N:N intermediate tables: Table usually has name: class1_class2 or similar
11. DO NOT generate methods - the "methods" array always empty []
12. Position classes in grid incrementing x by 300, y by 250

VISUAL EXAMPLE OF MULTIPLICITY:
If in the image you see: [ClassA] ---1-------*--- [ClassB]
Then the relationship must have: { "source": "1", "target": "*" }

If you see: [Producto] ---*---- [producto_catalogo] ----*--- [Catalogo]
These are TWO separate relationships:
  Relationship 1: Producto to producto_catalogo with { "source": "*", "target": "1" }
  Relationship 2: producto_catalogo to Catalogo with { "source": "1", "target": "*" }`;
                    const claudeVisionMessage = await this.anthropic.messages.create({
                        model: this.CLAUDE_MODEL_MAIN,
                        max_tokens: 8192,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'image',
                                        source: {
                                            type: 'base64',
                                            media_type: mediaType,
                                            data: base64Data,
                                        },
                                    },
                                    {
                                        type: 'text',
                                        text: visionPrompt,
                                    },
                                ],
                            },
                        ],
                    });
                    if (!claudeVisionMessage.content || claudeVisionMessage.content.length === 0) {
                        throw new Error('Invalid response from Claude Vision API');
                    }
                    const visionText = claudeVisionMessage.content[0].type === 'text' ? claudeVisionMessage.content[0].text : '';
                    console.log('\n═══════════════════════════════════════════════════════');
                    console.log('📝 RESPUESTA COMPLETA DE CLAUDE VISION:');
                    console.log('═══════════════════════════════════════════════════════');
                    console.log(visionText);
                    console.log('═══════════════════════════════════════════════════════\n');
                    let cleanedResponse = visionText.trim();
                    if (cleanedResponse.startsWith('```json')) {
                        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
                    }
                    else if (cleanedResponse.startsWith('```')) {
                        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
                    }
                    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        cleanedResponse = jsonMatch[0];
                    }
                    let umlModel;
                    try {
                        umlModel = JSON.parse(cleanedResponse);
                        console.log('✅ Diagrama extraído de imagen. Clases:', umlModel.classes?.length);
                        console.log('\n═══════════════════════════════════════════════════════');
                        console.log('🔍 MODELO JSON PARSEADO COMPLETO:');
                        console.log('═══════════════════════════════════════════════════════');
                        console.log(JSON.stringify(umlModel, null, 2));
                        console.log('═══════════════════════════════════════════════════════\n');
                        if (umlModel.relations && umlModel.relations.length > 0) {
                            console.log('🔗 MULTIPLICIDADES EXTRAÍDAS DE LA IMAGEN (RAW):');
                            umlModel.relations.forEach((rel, idx) => {
                                console.log(`  Relación ${idx + 1}: ${rel.sourceClassId} -> ${rel.targetClassId}`);
                                console.log(`    Tipo: ${rel.type}`);
                                console.log(`    Multiplicidad RAW:`, rel.multiplicity);
                                console.log(`    Tipo de multiplicidad: ${typeof rel.multiplicity}`);
                                if (typeof rel.multiplicity === 'object' && rel.multiplicity) {
                                    console.log(`      - source: "${rel.multiplicity.source}"`);
                                    console.log(`      - target: "${rel.multiplicity.target}"`);
                                }
                                console.log('');
                            });
                        }
                    }
                    catch (parseError) {
                        console.error('❌ Error parseando JSON de imagen:', parseError.message);
                        console.error('Contenido que intentó parsear:', cleanedResponse?.substring(0, 500));
                        throw new Error('No se pudo extraer el diagrama de la imagen. Intenta con una imagen más clara.');
                    }
                    umlModel = this.validateAndFixModel(umlModel);
                    console.log('\n═══════════════════════════════════════════════════════');
                    console.log('✅ MODELO DESPUÉS DE VALIDACIÓN:');
                    console.log('═══════════════════════════════════════════════════════');
                    if (umlModel.relations && umlModel.relations.length > 0) {
                        console.log('🔗 MULTIPLICIDADES DESPUÉS DE validateAndFixModel:');
                        umlModel.relations.forEach((rel, idx) => {
                            console.log(`  Relación ${idx + 1}: ${rel.sourceClassId} -> ${rel.targetClassId}`);
                            console.log(`    Tipo: ${rel.type}`);
                            console.log(`    Multiplicidad VALIDADA:`, rel.multiplicity);
                            if (typeof rel.multiplicity === 'object' && rel.multiplicity) {
                                console.log(`      - source: "${rel.multiplicity.source}"`);
                                console.log(`      - target: "${rel.multiplicity.target}"`);
                            }
                            console.log('');
                        });
                    }
                    console.log('═══════════════════════════════════════════════════════\n');
                    await this.prisma.diagramActivity.create({
                        data: {
                            action: 'AI_IMAGE_ANALYSIS',
                            changes: {
                                message,
                                extractedModel: umlModel,
                                imageProvided: true,
                            },
                            userId,
                            diagramId,
                        },
                    });
                    const processingTime = Date.now() - imageProcessingStartTime;
                    console.log(`✅ Imagen procesada exitosamente en ${processingTime}ms`);
                    return {
                        response: `✨ ${umlModel.name} (extraído de imagen)`,
                        suggestions: [
                            'Modificar atributos',
                            'Cambiar relaciones',
                            'Agregar más clases',
                            'Ajustar multiplicidades'
                        ],
                        model: umlModel,
                    };
                }
                catch (imageError) {
                    const processingTime = Date.now() - imageProcessingStartTime;
                    console.error('\n❌❌❌ ERROR PROCESANDO IMAGEN ❌❌❌');
                    console.error(`Tiempo transcurrido: ${processingTime}ms`);
                    console.error(`Error tipo: ${imageError.name}`);
                    console.error(`Error mensaje: ${imageError.message}`);
                    console.error(`Error stack:`, imageError.stack);
                    try {
                        const failedImagesDir = path.join(process.cwd(), 'failed-images');
                        if (!fs.existsSync(failedImagesDir)) {
                            fs.mkdirSync(failedImagesDir, { recursive: true });
                        }
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const fileName = `failed-${timestamp}.jpg`;
                        const filePath = path.join(failedImagesDir, fileName);
                        const base64Match = imageBase64.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
                        if (base64Match) {
                            const base64Data = base64Match[2];
                            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                            console.log(`💾 Imagen guardada en: ${filePath}`);
                        }
                        const errorLogPath = path.join(failedImagesDir, `error-${timestamp}.txt`);
                        const errorLog = `
Timestamp: ${new Date().toISOString()}
User ID: ${userId}
Diagram ID: ${diagramId}
Processing Time: ${processingTime}ms
Error Type: ${imageError.name}
Error Message: ${imageError.message}
Stack Trace:
${imageError.stack}
`;
                        fs.writeFileSync(errorLogPath, errorLog);
                        console.log(`📄 Log guardado en: ${errorLogPath}`);
                    }
                    catch (saveError) {
                        console.error('⚠️ No se pudo guardar la imagen/log:', saveError);
                    }
                    return {
                        response: '😅 Lo siento, tuve problemas al analizar esta imagen. Por favor intenta con una imagen más clara o describe el sistema con texto.',
                        suggestions: [
                            'Intenta con una imagen más simple',
                            'Asegúrate de que el diagrama sea legible',
                            'Prueba describiendo el sistema con texto',
                            'Verifica que la imagen no sea muy grande'
                        ],
                    };
                }
            }
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
      "multiplicity": {
        "source": "1|0..1|1..*|*|0..*",
        "target": "1|0..1|1..*|*|0..*"
      }
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
- ManyToMany: Relaciones muchos a muchos (líneas discontinuas en el diagrama)

GENERACIÓN DE FOREIGN KEYS (FK):
- Para relaciones OneToMany: agregar FK en el lado "many" (ejemplo: Estudiante 1:N Nota → Nota tiene "estudianteId" con stereotype="fk")
- Para relaciones ManyToOne: agregar FK en el lado source
- Para relaciones AGGREGATION: agregar FK en la clase contenida
- Para relaciones COMPOSITION: agregar FK en la clase contenida con nullable=false
- FK siempre deben tener: type="Long", stereotype="fk", unique=false
- El nombre del FK debe ser: nombreClaseReferenciadaId (ejemplo: "estudianteId", "cursoId", "pedidoId")

MULTIPLICIDAD (FORMATO OBJETO):
- Formato: { "source": "valor", "target": "valor" }
- { "source": "1", "target": "1" } = uno a uno
- { "source": "1", "target": "*" } = uno a muchos
- { "source": "*", "target": "*" } = muchos a muchos (requiere crear clase intermedia explícitamente)
- { "source": "0..1", "target": "1..*" } = opcional a uno o más
- Siempre incluir multiplicidad en las relaciones

EJEMPLOS CONCRETOS:

EJEMPLO 1 - ESTUDIANTE Y NOTA (1:N con AGGREGATION):
Clase Estudiante: { id, nombre, email } - sin FK
Clase Nota: { id, valor, materia, estudianteId (stereotype="fk", type="Long") }
Relación: { type: "AGGREGATION", sourceClassId: "cls_estudiante", targetClassId: "cls_nota", multiplicity: { "source": "1", "target": "*" } }

EJEMPLO 2 - ESTUDIANTE Y CURSO (N:M con ASSOCIATION):
Clase Estudiante: { id, nombre, email } - sin FK directo
Clase Curso: { id, nombre, creditos } - sin FK directo
Relación: { type: "ManyToMany", sourceClassId: "cls_estudiante", targetClassId: "cls_curso", multiplicity: { "source": "*", "target": "*" } }
NOTA: Se creará automáticamente tabla intermedia estudiante_curso con FKs

EJEMPLO 3 - PEDIDO Y LINEA PEDIDO (1:N con COMPOSITION):
Clase Pedido: { id, fecha, total } - sin FK
Clase LineaPedido: { id, cantidad, precioUnitario, pedidoId (stereotype="fk", type="Long", nullable=false) }
Relación: { type: "COMPOSITION", sourceClassId: "cls_pedido", targetClassId: "cls_lineapedido", multiplicity: { "source": "1", "target": "*" } }

EJEMPLO 4 - DEPARTAMENTO Y EMPLEADO (1:N con AGGREGATION):
Clase Departamento: { id, nombre } - sin FK
Clase Empleado: { id, nombre, salario, departamentoId (stereotype="fk", type="Long") }
Relación: { type: "AGGREGATION", sourceClassId: "cls_departamento", targetClassId: "cls_empleado", multiplicity: { "source": "1", "target": "*" } }

EJEMPLO 5 - PERSONA Y ESTUDIANTE (HERENCIA):
Clase Persona: { id, nombre, dni }
Clase Estudiante: { id, matricula, carrera }
Relación: { type: "INHERITANCE", sourceClassId: "cls_estudiante", targetClassId: "cls_persona", multiplicity: { "source": "", "target": "" } }
NOTA: Estudiante hereda de Persona

EJEMPLO 6 - PRODUCTO Y CATEGORIA (N:M):
Clase Producto: { id, nombre, precio } - sin FK directo
Clase Categoria: { id, nombre, descripcion } - sin FK directo
Relación: { type: "ManyToMany", sourceClassId: "cls_producto", targetClassId: "cls_categoria", multiplicity: { "source": "*", "target": "*" } }
NOTA: El sistema creará automáticamente la tabla producto_categoria`;
                const claudeMessage = await this.anthropic.messages.create({
                    model: this.CLAUDE_MODEL_FAST,
                    max_tokens: this.MaxTokens,
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
                let cleanedResponse = generatedText.trim();
                if (cleanedResponse.startsWith('```json')) {
                    cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
                }
                else if (cleanedResponse.startsWith('```')) {
                    cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
                }
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    cleanedResponse = jsonMatch[0];
                }
                let umlModel;
                try {
                    umlModel = JSON.parse(cleanedResponse);
                    console.log('✅ JSON parseado exitosamente. Clases:', umlModel.classes?.length);
                }
                catch (parseError) {
                    console.error('❌ Error parseando JSON de Claude:', parseError.message);
                    console.error('Respuesta limpia:', cleanedResponse.substring(0, 300));
                    console.log('🔄 Usando modelo de fallback para:', message);
                    umlModel = this.generateFallbackModel(message);
                }
                umlModel = this.validateAndFixModel(umlModel);
                await this.prisma.diagramActivity.create({
                    data: {
                        action: 'AI_GENERATION',
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
                return {
                    response: `✨ ${umlModel.name}`,
                    suggestions: [
                        'Agregar más clases',
                        'Modificar atributos',
                        'Crear más relaciones',
                        'Generar otro sistema'
                    ],
                    model: umlModel,
                };
            }
            else {
                const systemPrompt = `Eres un consultor experto en UML y arquitecto de software. Ayuda al usuario con sus preguntas sobre diagramas UML y proporciona consejos prácticos. Responde siempre en español de manera concisa.

${diagramContext ? `CONTEXTO DEL DIAGRAMA ACTUAL:
El usuario tiene un diagrama con la siguiente estructura:
${JSON.stringify(diagramContext, null, 2)}

Si el usuario pregunta sobre su diagrama, analiza el contexto actual.` : 'Sin contexto de diagrama actual.'}

IMPORTANTE: Sé conciso pero informativo en tus respuestas.`;
                const claudeMessage = await this.anthropic.messages.create({
                    model: this.CLAUDE_MODEL_FAST,
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
        }
        catch (error) {
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
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        diagram_service_1.DiagramService])
], AiChatService);
//# sourceMappingURL=ai-chat.service.js.map