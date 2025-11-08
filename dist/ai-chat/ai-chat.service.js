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
let AiChatService = class AiChatService {
    constructor(prisma, configService, diagramService) {
        this.prisma = prisma;
        this.configService = configService;
        this.diagramService = diagramService;
        const apiKey = this.configService.get('CLAUDE_API_KEY');
        this.anthropic = new sdk_1.default({
            apiKey: apiKey,
        });
    }
    async generateUMLFromPrompt(prompt, diagramId, userId) {
        try {
            const systemPrompt = `Eres un experto arquitecto de software especializado en diseño de sistemas y diagramas UML. Tu tarea es analizar la solicitud del usuario y generar un diagrama de clases UML completo y profesional.

ANALIZA el dominio del negocio mencionado (farmacia, ferretería, restaurante, hospital, etc.) y crea las clases necesarias con sus atributos, métodos y relaciones apropiadas.

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
          "stereotype": "id",
          "nullable": false,
          "unique": true
        }
      ],
      "methods": [
        {
          "id": "method_1",
          "name": "nombreMetodo",
          "returnType": "void|String|Boolean|BigDecimal|etc",
          "parameters": [],
          "visibility": "public"
        }
      ],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "sourceClassId": "cls_clase1",
      "targetClassId": "cls_clase2",
      "type": "OneToOne|OneToMany|ManyToOne|ManyToMany",
      "name": "nombreRelacion"
    }
  ]
}

REGLAS IMPORTANTES:
1. Analiza el contexto del negocio y crea entre 3-6 clases relevantes
2. SIEMPRE incluir atributo "id" como primer atributo de cada clase con: type: "Long", stereotype: "id", nullable: false, unique: true
3. Usa nombres descriptivos en español si el usuario habla español
4. Tipos de datos apropiados: String, Long, Integer, BigDecimal (para precios/dinero), LocalDate, LocalDateTime, Boolean
5. Posiciona clases en cuadrícula: incrementa x por 300, y por 250
6. Crea relaciones lógicas entre clases (OneToMany, ManyToOne, etc.)
7. Agrega métodos de negocio relevantes (calcular, validar, actualizar, etc.)
8. Para cada dominio considera:
   - FARMACIA: Medicamento, Cliente, Venta, Proveedor, Receta
   - FERRETERÍA: Producto, Cliente, Venta, Proveedor, Categoría
   - RESTAURANTE: Plato, Pedido, Cliente, Mesa, Empleado
   - HOSPITAL: Paciente, Doctor, Cita, Tratamiento, Habitación
   - ESCUELA: Estudiante, Profesor, Curso, Materia, Calificación`;
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
    generateEcommerceModel() {
        return {
            name: 'E-commerce System',
            classes: [
                {
                    id: 'cls_user',
                    name: 'User',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'email', type: 'String', nullable: false, unique: true },
                        { id: 'attr_3', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_4', name: 'password', type: 'String', nullable: false, unique: false },
                        { id: 'attr_5', name: 'address', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [
                        { id: 'method_1', name: 'login', returnType: 'Boolean', parameters: [], visibility: 'public' },
                        { id: 'method_2', name: 'updateProfile', returnType: 'void', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_product',
                    name: 'Product',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_6', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_7', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_8', name: 'description', type: 'String', nullable: true, unique: false },
                        { id: 'attr_9', name: 'price', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_10', name: 'stock', type: 'Integer', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_3', name: 'updateStock', returnType: 'void', parameters: [], visibility: 'public' },
                        { id: 'method_4', name: 'calculateDiscount', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_category',
                    name: 'Category',
                    position: { x: 700, y: 100 },
                    attributes: [
                        { id: 'attr_11', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_12', name: 'name', type: 'String', nullable: false, unique: true },
                        { id: 'attr_13', name: 'description', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_order',
                    name: 'Order',
                    position: { x: 250, y: 350 },
                    attributes: [
                        { id: 'attr_14', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_15', name: 'orderDate', type: 'LocalDateTime', nullable: false, unique: false },
                        { id: 'attr_16', name: 'status', type: 'String', nullable: false, unique: false },
                        { id: 'attr_17', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_5', name: 'calculateTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                        { id: 'method_6', name: 'updateStatus', returnType: 'void', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_product',
                    targetClassId: 'cls_category',
                    type: 'ManyToOne',
                    name: 'category',
                },
                {
                    id: 'rel_2',
                    sourceClassId: 'cls_order',
                    targetClassId: 'cls_user',
                    type: 'ManyToOne',
                    name: 'customer',
                },
            ],
        };
    }
    generateLibraryModel() {
        return {
            name: 'Library Management System',
            classes: [
                {
                    id: 'cls_book',
                    name: 'Book',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'isbn', type: 'String', nullable: false, unique: true },
                        { id: 'attr_3', name: 'title', type: 'String', nullable: false, unique: false },
                        { id: 'attr_4', name: 'publishedDate', type: 'LocalDate', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_author',
                    name: 'Author',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_6', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_7', name: 'biography', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_borrower',
                    name: 'Borrower',
                    position: { x: 100, y: 350 },
                    attributes: [
                        { id: 'attr_8', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_9', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_10', name: 'email', type: 'String', nullable: false, unique: true },
                        { id: 'attr_11', name: 'membershipDate', type: 'LocalDate', nullable: false, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_book',
                    targetClassId: 'cls_author',
                    type: 'ManyToOne',
                    name: 'author',
                },
            ],
        };
    }
    generateBlogModel() {
        return {
            name: 'Blog Platform',
            classes: [
                {
                    id: 'cls_user',
                    name: 'User',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'username', type: 'String', nullable: false, unique: true },
                        { id: 'attr_3', name: 'email', type: 'String', nullable: false, unique: true },
                        { id: 'attr_4', name: 'bio', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_post',
                    name: 'Post',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_6', name: 'title', type: 'String', nullable: false, unique: false },
                        { id: 'attr_7', name: 'content', type: 'String', nullable: false, unique: false },
                        { id: 'attr_8', name: 'publishedAt', type: 'LocalDateTime', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_comment',
                    name: 'Comment',
                    position: { x: 400, y: 350 },
                    attributes: [
                        { id: 'attr_9', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_10', name: 'content', type: 'String', nullable: false, unique: false },
                        { id: 'attr_11', name: 'createdAt', type: 'LocalDateTime', nullable: false, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_post',
                    targetClassId: 'cls_user',
                    type: 'ManyToOne',
                    name: 'author',
                },
                {
                    id: 'rel_2',
                    sourceClassId: 'cls_comment',
                    targetClassId: 'cls_post',
                    type: 'ManyToOne',
                    name: 'post',
                },
                {
                    id: 'rel_3',
                    sourceClassId: 'cls_comment',
                    targetClassId: 'cls_user',
                    type: 'ManyToOne',
                    name: 'author',
                },
            ],
        };
    }
    generateRestaurantModel() {
        return {
            name: 'Restaurant Ordering System',
            classes: [
                {
                    id: 'cls_customer',
                    name: 'Customer',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_3', name: 'phone', type: 'String', nullable: false, unique: false },
                        { id: 'attr_4', name: 'address', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_menuitem',
                    name: 'MenuItem',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_6', name: 'name', type: 'String', nullable: false, unique: false },
                        { id: 'attr_7', name: 'description', type: 'String', nullable: true, unique: false },
                        { id: 'attr_8', name: 'price', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_9', name: 'category', type: 'String', nullable: false, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_order',
                    name: 'Order',
                    position: { x: 250, y: 350 },
                    attributes: [
                        { id: 'attr_10', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_11', name: 'orderTime', type: 'LocalDateTime', nullable: false, unique: false },
                        { id: 'attr_12', name: 'status', type: 'String', nullable: false, unique: false },
                        { id: 'attr_13', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_1', name: 'calculateTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_order',
                    targetClassId: 'cls_customer',
                    type: 'ManyToOne',
                    name: 'customer',
                },
            ],
        };
    }
    generateHardwareStoreModel() {
        return {
            name: 'Sistema de Ferretería',
            classes: [
                {
                    id: 'cls_producto',
                    name: 'Producto',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'nombre', type: 'String', nullable: false, unique: false },
                        { id: 'attr_3', name: 'codigo', type: 'String', nullable: false, unique: true },
                        { id: 'attr_4', name: 'precio', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_5', name: 'stock', type: 'Integer', nullable: false, unique: false },
                        { id: 'attr_6', name: 'unidadMedida', type: 'String', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_1', name: 'actualizarStock', returnType: 'void', parameters: [], visibility: 'public' },
                        { id: 'method_2', name: 'calcularPrecioConIVA', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_categoria',
                    name: 'Categoria',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_7', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_8', name: 'nombre', type: 'String', nullable: false, unique: true },
                        { id: 'attr_9', name: 'descripcion', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_cliente',
                    name: 'Cliente',
                    position: { x: 700, y: 100 },
                    attributes: [
                        { id: 'attr_10', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_11', name: 'nombre', type: 'String', nullable: false, unique: false },
                        { id: 'attr_12', name: 'ruc', type: 'String', nullable: true, unique: true },
                        { id: 'attr_13', name: 'telefono', type: 'String', nullable: true, unique: false },
                        { id: 'attr_14', name: 'direccion', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_venta',
                    name: 'Venta',
                    position: { x: 250, y: 350 },
                    attributes: [
                        { id: 'attr_15', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_16', name: 'fecha', type: 'LocalDateTime', nullable: false, unique: false },
                        { id: 'attr_17', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_18', name: 'formaPago', type: 'String', nullable: false, unique: false },
                        { id: 'attr_19', name: 'numeroFactura', type: 'String', nullable: true, unique: true },
                    ],
                    methods: [
                        { id: 'method_3', name: 'calcularTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                        { id: 'method_4', name: 'generarFactura', returnType: 'String', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_proveedor',
                    name: 'Proveedor',
                    position: { x: 550, y: 350 },
                    attributes: [
                        { id: 'attr_20', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_21', name: 'razonSocial', type: 'String', nullable: false, unique: false },
                        { id: 'attr_22', name: 'ruc', type: 'String', nullable: false, unique: true },
                        { id: 'attr_23', name: 'telefono', type: 'String', nullable: true, unique: false },
                        { id: 'attr_24', name: 'email', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_producto',
                    targetClassId: 'cls_categoria',
                    type: 'ManyToOne',
                    name: 'categoria',
                },
                {
                    id: 'rel_2',
                    sourceClassId: 'cls_venta',
                    targetClassId: 'cls_cliente',
                    type: 'ManyToOne',
                    name: 'cliente',
                },
                {
                    id: 'rel_3',
                    sourceClassId: 'cls_producto',
                    targetClassId: 'cls_proveedor',
                    type: 'ManyToOne',
                    name: 'proveedor',
                },
            ],
        };
    }
    generatePharmacyModel() {
        return {
            name: 'Sistema de Farmacia',
            classes: [
                {
                    id: 'cls_medicamento',
                    name: 'Medicamento',
                    position: { x: 100, y: 100 },
                    attributes: [
                        { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_2', name: 'nombre', type: 'String', nullable: false, unique: false },
                        { id: 'attr_3', name: 'principioActivo', type: 'String', nullable: false, unique: false },
                        { id: 'attr_4', name: 'precio', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_5', name: 'stock', type: 'Integer', nullable: false, unique: false },
                        { id: 'attr_6', name: 'requiereReceta', type: 'Boolean', nullable: false, unique: false },
                        { id: 'attr_7', name: 'fechaVencimiento', type: 'LocalDate', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_1', name: 'actualizarStock', returnType: 'void', parameters: [], visibility: 'public' },
                        { id: 'method_2', name: 'verificarVencimiento', returnType: 'Boolean', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_cliente',
                    name: 'Cliente',
                    position: { x: 400, y: 100 },
                    attributes: [
                        { id: 'attr_8', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_9', name: 'nombre', type: 'String', nullable: false, unique: false },
                        { id: 'attr_10', name: 'dni', type: 'String', nullable: false, unique: true },
                        { id: 'attr_11', name: 'telefono', type: 'String', nullable: true, unique: false },
                        { id: 'attr_12', name: 'email', type: 'String', nullable: true, unique: false },
                        { id: 'attr_13', name: 'direccion', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_venta',
                    name: 'Venta',
                    position: { x: 250, y: 350 },
                    attributes: [
                        { id: 'attr_14', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_15', name: 'fecha', type: 'LocalDateTime', nullable: false, unique: false },
                        { id: 'attr_16', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
                        { id: 'attr_17', name: 'formaPago', type: 'String', nullable: false, unique: false },
                        { id: 'attr_18', name: 'tieneReceta', type: 'Boolean', nullable: false, unique: false },
                    ],
                    methods: [
                        { id: 'method_3', name: 'calcularTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
                        { id: 'method_4', name: 'validarReceta', returnType: 'Boolean', parameters: [], visibility: 'public' },
                    ],
                    stereotypes: ['entity'],
                },
                {
                    id: 'cls_proveedor',
                    name: 'Proveedor',
                    position: { x: 550, y: 350 },
                    attributes: [
                        { id: 'attr_19', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
                        { id: 'attr_20', name: 'razonSocial', type: 'String', nullable: false, unique: false },
                        { id: 'attr_21', name: 'ruc', type: 'String', nullable: false, unique: true },
                        { id: 'attr_22', name: 'telefono', type: 'String', nullable: true, unique: false },
                        { id: 'attr_23', name: 'email', type: 'String', nullable: true, unique: false },
                    ],
                    methods: [],
                    stereotypes: ['entity'],
                },
            ],
            relations: [
                {
                    id: 'rel_1',
                    sourceClassId: 'cls_venta',
                    targetClassId: 'cls_cliente',
                    type: 'ManyToOne',
                    name: 'cliente',
                },
                {
                    id: 'rel_2',
                    sourceClassId: 'cls_medicamento',
                    targetClassId: 'cls_proveedor',
                    type: 'ManyToOne',
                    name: 'proveedor',
                },
            ],
        };
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
        return model;
    }
    generateFallbackModel(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('ferreteria') || lowerPrompt.includes('ferretería') ||
            lowerPrompt.includes('hardware') || lowerPrompt.includes('herramienta') ||
            lowerPrompt.includes('construccion') || lowerPrompt.includes('construcción')) {
            return this.generateHardwareStoreModel();
        }
        else if (lowerPrompt.includes('farmacia') || lowerPrompt.includes('pharmacy') ||
            lowerPrompt.includes('medicamento') || lowerPrompt.includes('medicine') ||
            lowerPrompt.includes('droga') || lowerPrompt.includes('drug')) {
            return this.generatePharmacyModel();
        }
        else if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('e-commerce') ||
            lowerPrompt.includes('shop') || lowerPrompt.includes('tienda') ||
            (lowerPrompt.includes('product') && lowerPrompt.includes('order')) ||
            (lowerPrompt.includes('producto') && lowerPrompt.includes('pedido'))) {
            return this.generateEcommerceModel();
        }
        else if (lowerPrompt.includes('library') || lowerPrompt.includes('book') ||
            lowerPrompt.includes('biblioteca') || lowerPrompt.includes('libro')) {
            return this.generateLibraryModel();
        }
        else if (lowerPrompt.includes('blog') || lowerPrompt.includes('post') ||
            lowerPrompt.includes('articulo') || lowerPrompt.includes('comentario')) {
            return this.generateBlogModel();
        }
        else if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('restaurante') ||
            (lowerPrompt.includes('menu') && lowerPrompt.includes('order'))) {
            return this.generateRestaurantModel();
        }
        else {
            return this.generateGenericModel(prompt);
        }
    }
    async chatWithAI(message, diagramId, userId) {
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
- Si el usuario pide AGREGAR algo nuevo (clase, atributo, método, relación): MANTÉN todo lo existente y AGREGA lo nuevo
- Si el usuario pide CAMBIAR/MODIFICAR algo existente (cambiar tipo de relación, modificar atributo, etc.): MANTÉN todo lo demás y SOLO modifica lo específicamente mencionado
- Si el usuario pide ELIMINAR algo: MANTÉN todo lo demás y QUITA solo lo mencionado
- Si pide crear un SISTEMA COMPLETAMENTE NUEVO no relacionado con el actual: genera un diagrama nuevo desde cero

EJEMPLOS:
- "cambiar la relación entre Medico e HistorialMedico a agregación" → Mantén todas las clases y relaciones, solo cambia el tipo de esa relación específica
- "agregar clase Empleado" → Mantén todo y agrega la nueva clase
- "modificar atributo nombre en Paciente" → Mantén todo y modifica solo ese atributo` : 'No hay diagrama existente. Genera un nuevo diagrama completo desde cero.'}

ANALIZA el dominio del negocio mencionado y crea/modifica las clases necesarias con sus atributos, métodos y relaciones apropiadas.

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
          "stereotype": "id",
          "nullable": false,
          "unique": true
        }
      ],
      "methods": [
        {
          "id": "method_1",
          "name": "nombreMetodo",
          "returnType": "void|String|Boolean|BigDecimal|etc",
          "parameters": [],
          "visibility": "public"
        }
      ],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "sourceClassId": "cls_clase1",
      "targetClassId": "cls_clase2",
      "type": "OneToOne|OneToMany|ManyToOne|ManyToMany",
      "name": "nombreRelacion"
    }
  ]
}

REGLAS IMPORTANTES:
1. Analiza el contexto del negocio y crea entre 3-6 clases relevantes
2. SIEMPRE incluir atributo "id" como primer atributo de cada clase con: type: "Long", stereotype: "id", nullable: false, unique: true
3. Usa nombres descriptivos en español si el usuario habla español
4. Tipos de datos apropiados: String, Long, Integer, BigDecimal (para precios/dinero), LocalDate, LocalDateTime, Boolean
5. Posiciona clases en cuadrícula: incrementa x por 300, y por 250
6. Crea relaciones lógicas entre clases (OneToMany, ManyToOne, etc.)
7. Agrega métodos de negocio relevantes (calcular, validar, actualizar, etc.)`;
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