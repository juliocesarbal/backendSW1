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
let AiChatService = class AiChatService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async generateUMLFromPrompt(prompt, diagramId, userId) {
        try {
            const lowerPrompt = prompt.toLowerCase();
            let mockUMLModel;
            if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('e-commerce') || lowerPrompt.includes('shop')) {
                mockUMLModel = this.generateEcommerceModel();
            }
            else if (lowerPrompt.includes('library') || lowerPrompt.includes('book')) {
                mockUMLModel = this.generateLibraryModel();
            }
            else if (lowerPrompt.includes('blog') || lowerPrompt.includes('post')) {
                mockUMLModel = this.generateBlogModel();
            }
            else if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('order')) {
                mockUMLModel = this.generateRestaurantModel();
            }
            else {
                mockUMLModel = this.generateGenericModel(prompt);
            }
            await this.prisma.diagramActivity.create({
                data: {
                    action: 'AI_GENERATION',
                    changes: {
                        prompt,
                        generatedModel: mockUMLModel,
                    },
                    userId,
                    diagramId,
                },
            });
            return {
                success: true,
                model: mockUMLModel,
                message: 'UML model generated successfully',
            };
        }
        catch (error) {
            console.error('Error generating UML model:', error);
            throw new Error('Failed to generate UML model');
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
    async chatWithAI(message, context) {
        return {
            response: `I understand you want to: "${message}". Let me help you create a UML diagram for that.`,
            suggestions: [
                'Create a User class with basic attributes',
                'Add relationships between entities',
                'Generate a complete e-commerce model',
            ],
        };
    }
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiChatService);
//# sourceMappingURL=ai-chat.service.js.map