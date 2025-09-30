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
exports.DiagramController = void 0;
const common_1 = require("@nestjs/common");
const diagram_service_1 = require("./diagram.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const class_validator_1 = require("class-validator");
class CreateDiagramDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDiagramDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDiagramDto.prototype, "workspaceId", void 0);
class UpdateDiagramDto {
}
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateDiagramDto.prototype, "data", void 0);
class AddClassDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddClassDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AddClassDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AddClassDto.prototype, "attributes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AddClassDto.prototype, "methods", void 0);
let DiagramController = class DiagramController {
    constructor(diagramService) {
        this.diagramService = diagramService;
    }
    async createDiagram(createDiagramDto, req) {
        return this.diagramService.createDiagram(createDiagramDto.workspaceId, req.user.userId, createDiagramDto.name);
    }
    async getDiagramById(id, req) {
        return this.diagramService.getDiagramById(id, req.user.userId);
    }
    async updateDiagram(id, updateDiagramDto, req) {
        return this.diagramService.updateDiagram(id, req.user.userId, updateDiagramDto.data);
    }
    async addUMLClass(id, addClassDto, req) {
        return this.diagramService.addUMLClass(id, req.user.userId, addClassDto);
    }
    async deleteDiagram(id, req) {
        return this.diagramService.deleteDiagram(id, req.user.userId);
    }
};
exports.DiagramController = DiagramController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateDiagramDto, Object]),
    __metadata("design:returntype", Promise)
], DiagramController.prototype, "createDiagram", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DiagramController.prototype, "getDiagramById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDiagramDto, Object]),
    __metadata("design:returntype", Promise)
], DiagramController.prototype, "updateDiagram", null);
__decorate([
    (0, common_1.Post)(':id/classes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddClassDto, Object]),
    __metadata("design:returntype", Promise)
], DiagramController.prototype, "addUMLClass", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DiagramController.prototype, "deleteDiagram", null);
exports.DiagramController = DiagramController = __decorate([
    (0, common_1.Controller)('diagrams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [diagram_service_1.DiagramService])
], DiagramController);
//# sourceMappingURL=diagram.controller.js.map