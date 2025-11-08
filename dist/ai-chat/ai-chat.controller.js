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
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatDto.prototype, "diagramId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatDto.prototype, "image", void 0);
let AiChatController = class AiChatController {
    constructor(aiChatService) {
        this.aiChatService = aiChatService;
    }
    async generateUML(generateUMLDto, req) {
        return this.aiChatService.generateUMLFromPrompt(generateUMLDto.prompt, generateUMLDto.diagramId, req.user.userId);
    }
    async chat(chatDto, req) {
        return this.aiChatService.chatWithAI(chatDto.message, chatDto.diagramId, req.user.userId, chatDto.image);
    }
    async getSuggestions() {
        return {
            suggestions: [
                'Crear un sistema de farmacia',
                'Diseñar una ferretería con productos y ventas',
                'Crear un e-commerce con productos y pedidos',
                'Modelar un sistema de biblioteca',
                'Generar un blog con posts y comentarios',
                'Crear un sistema de restaurante',
                'Diseñar un hospital con pacientes y doctores',
                'Modelar una escuela con estudiantes y profesores'
            ]
        };
    }
    async getTemplates() {
        return {
            templates: [
                {
                    id: 'farmacia',
                    name: 'Sistema de Farmacia',
                    description: 'Sistema completo de farmacia con medicamentos, clientes, ventas y proveedores',
                    prompt: 'Crear un sistema de farmacia con Medicamento, Cliente, Venta y Proveedor'
                },
                {
                    id: 'ferreteria',
                    name: 'Sistema de Ferretería',
                    description: 'Gestión de ferretería con productos, categorías, clientes y ventas',
                    prompt: 'Diseñar una ferretería con Producto, Categoría, Cliente, Venta y Proveedor'
                },
                {
                    id: 'ecommerce',
                    name: 'E-commerce',
                    description: 'Plataforma de compras online con usuarios, productos, pedidos y pagos',
                    prompt: 'Crear un e-commerce con Usuario, Producto, Categoría, Pedido y Pago'
                },
                {
                    id: 'biblioteca',
                    name: 'Biblioteca',
                    description: 'Sistema de préstamos con libros, autores y prestamistas',
                    prompt: 'Modelar una biblioteca con Libro, Autor, Prestamista y Préstamo'
                },
                {
                    id: 'restaurante',
                    name: 'Restaurante',
                    description: 'Sistema de pedidos con clientes, menú y órdenes',
                    prompt: 'Crear un restaurante con Cliente, Plato, Pedido y Mesa'
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
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChatDto, Object]),
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