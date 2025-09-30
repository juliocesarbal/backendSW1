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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatController = void 0;
const common_1 = require("@nestjs/common");
const ai_chat_service_1 = require("./ai-chat.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const class_validator_1 = require("class-validator");
class GenerateUMLDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateUMLDto.prototype, "prompt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateUMLDto.prototype, "diagramId", void 0);
class ChatDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChatDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ChatDto.prototype, "context", void 0);
let AiChatController = class AiChatController {
    constructor(aiChatService) {
        this.aiChatService = aiChatService;
    }
    async generateUML(generateUMLDto, req) {
        return this.aiChatService.generateUMLFromPrompt(generateUMLDto.prompt, generateUMLDto.diagramId, req.user.userId);
    }
    async chat(chatDto) {
        return this.aiChatService.chatWithAI(chatDto.message, chatDto.context);
    }
    async getSuggestions() {
        return {
            suggestions: [
                'Create an e-commerce system with products, users, and orders',
                'Design a library management system with books and borrowers',
                'Build a blog platform with users, posts, and comments',
                'Create a restaurant ordering system',
                'Design a social media platform',
                'Build a task management system',
                'Create an inventory management system',
                'Design a hotel booking system'
            ]
        };
    }
    async getTemplates() {
        return {
            templates: [
                {
                    id: 'ecommerce',
                    name: 'E-commerce System',
                    description: 'Complete online shopping platform with users, products, orders, and payments',
                    prompt: 'Create an e-commerce system with User, Product, Category, Order, OrderItem, and Payment entities'
                },
                {
                    id: 'library',
                    name: 'Library Management',
                    description: 'Book lending system with authors, books, borrowers, and loans',
                    prompt: 'Design a library management system with Book, Author, Borrower, and Loan entities'
                },
                {
                    id: 'blog',
                    name: 'Blog Platform',
                    description: 'Content management system with users, posts, comments, and categories',
                    prompt: 'Create a blog platform with User, Post, Comment, and Category entities'
                },
                {
                    id: 'restaurant',
                    name: 'Restaurant Ordering',
                    description: 'Food ordering system with customers, menu items, and orders',
                    prompt: 'Build a restaurant ordering system with Customer, MenuItem, Order, and OrderItem entities'
                }
            ]
        };
    }
};
exports.AiChatController = AiChatController;
__decorate([
    (0, common_1.Post)('generate-uml'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateUMLDto, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "generateUML", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChatDto]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "getTemplates", null);
exports.AiChatController = AiChatController = __decorate([
    (0, common_1.Controller)('ai-chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_chat_service_1.AiChatService])
], AiChatController);
//# sourceMappingURL=ai-chat.controller.js.map