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
const axios_1 = require("axios");
let AiChatService = class AiChatService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async generateUMLFromPrompt(prompt, diagramId, userId) {
        try {
            const geminiApiKey = this.configService.get('GEMINI_API_KEY');
            if (!geminiApiKey) {
                throw new Error('Gemini API key not configured');
            }
            const systemPrompt = `You are an expert UML diagram generator. Generate a JSON structure for a UML class diagram based on the user's request.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

The JSON should follow this exact structure:
{
  "name": "System Name",
  "classes": [
    {
      "id": "unique_class_id",
      "name": "ClassName",
      "position": { "x": 100, "y": 100 },
      "attributes": [
        {
          "id": "unique_attr_id",
          "name": "attributeName",
          "type": "String|Long|Integer|BigDecimal|LocalDate|LocalDateTime|Boolean",
          "stereotype": "id" (only for primary keys),
          "nullable": true|false,
          "unique": true|false
        }
      ],
      "methods": [
        {
          "id": "unique_method_id",
          "name": "methodName",
          "returnType": "void|String|Boolean|etc",
          "parameters": [],
          "visibility": "public|private|protected"
        }
      ],
      "stereotypes": ["entity"]
    }
  ],
  "relations": [
    {
      "id": "unique_relation_id",
      "sourceClassId": "source_class_id",
      "targetClassId": "target_class_id",
      "type": "OneToOne|OneToMany|ManyToOne|ManyToMany",
      "name": "relationName"
    }
  ]
}

Rules:
- Always include an "id" attribute with type "Long", stereotype "id", nullable: false, unique: true for each class
- Use appropriate Java/JPA types: String, Long, Integer, BigDecimal, LocalDate, LocalDateTime, Boolean
- Position classes in a grid layout (increment x by 300, y by 250 for each class)
- Create meaningful relationships between classes
- Include relevant methods for business logic

User request: ${prompt}`;
            const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': geminiApiKey
                }
            });
            if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response from Gemini API');
            }
            const generatedText = response.data.candidates[0].content.parts[0].text;
            let cleanedResponse = generatedText.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            }
            else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            let umlModel;
            try {
                umlModel = JSON.parse(cleanedResponse);
            }
            catch (parseError) {
                console.error('Failed to parse Gemini response:', cleanedResponse);
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
                message: 'UML model generated successfully with Gemini AI',
            };
        }
        catch (error) {
            console.error('Error generating UML model with Gemini:', error);
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
        if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('e-commerce') || lowerPrompt.includes('shop')) {
            return this.generateEcommerceModel();
        }
        else if (lowerPrompt.includes('library') || lowerPrompt.includes('book')) {
            return this.generateLibraryModel();
        }
        else if (lowerPrompt.includes('blog') || lowerPrompt.includes('post')) {
            return this.generateBlogModel();
        }
        else if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('order')) {
            return this.generateRestaurantModel();
        }
        else {
            return this.generateGenericModel(prompt);
        }
    }
    async chatWithAI(message, context) {
        try {
            const geminiApiKey = this.configService.get('GEMINI_API_KEY');
            if (!geminiApiKey) {
                throw new Error('Gemini API key not configured');
            }
            const systemPrompt = `You are an expert UML consultant and software architect. Help the user with their UML diagram questions and provide practical advice.

Current context: ${context ? JSON.stringify(context) : 'No current diagram context'}

User message: ${message}

Provide a helpful response about UML design, best practices, or suggestions. Be concise but informative.`;
            const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': geminiApiKey
                }
            });
            if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response from Gemini API');
            }
            const aiResponse = response.data.candidates[0].content.parts[0].text;
            return {
                response: aiResponse,
                suggestions: [
                    'Generate a UML diagram for this concept',
                    'Show me an e-commerce example',
                    'Create a user management system',
                    'Design a blog platform'
                ],
            };
        }
        catch (error) {
            console.error('Error in AI chat:', error);
            return {
                response: `I understand you want to know about: "${message}". Let me help you create a UML diagram for that. You can ask me to generate specific diagrams or explain UML concepts.`,
                suggestions: [
                    'Create a User class with basic attributes',
                    'Add relationships between entities',
                    'Generate a complete e-commerce model',
                    'Show me UML best practices'
                ],
            };
        }
    }
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiChatService);
//# sourceMappingURL=ai-chat.service.js.map