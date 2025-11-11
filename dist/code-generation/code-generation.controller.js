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
exports.CodeGenerationController = void 0;
const common_1 = require("@nestjs/common");
const code_generation_service_1 = require("./code-generation.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const fs = require("fs");
const path = require("path");
let CodeGenerationController = class CodeGenerationController {
    constructor(codeGenerationService) {
        this.codeGenerationService = codeGenerationService;
    }
    async generateSpringBoot(diagramId, req, res) {
        try {
            const result = await this.codeGenerationService.generateSpringBootProject(diagramId, req.user.userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    async downloadProject(generatedCodeId, req, res) {
        try {
            const zipPath = await this.codeGenerationService.downloadProject(generatedCodeId);
            if (!fs.existsSync(zipPath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Generated project file not found',
                });
            }
            const fileName = path.basename(zipPath);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            const fileStream = fs.createReadStream(zipPath);
            fileStream.pipe(res);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    async generateFlutter(diagramId, req, res) {
        try {
            const result = await this.codeGenerationService.generateFlutterProject(diagramId, req.user.userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getGeneratedProjects(req, res) {
        try {
            const projects = await this.codeGenerationService.getGeneratedProjects(req.user.userId);
            res.json({
                success: true,
                projects,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
};
exports.CodeGenerationController = CodeGenerationController;
__decorate([
    (0, common_1.Post)('spring-boot/:diagramId'),
    __param(0, (0, common_1.Param)('diagramId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CodeGenerationController.prototype, "generateSpringBoot", null);
__decorate([
    (0, common_1.Get)('download/:generatedCodeId'),
    __param(0, (0, common_1.Param)('generatedCodeId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CodeGenerationController.prototype, "downloadProject", null);
__decorate([
    (0, common_1.Post)('flutter/:diagramId'),
    __param(0, (0, common_1.Param)('diagramId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CodeGenerationController.prototype, "generateFlutter", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CodeGenerationController.prototype, "getGeneratedProjects", null);
exports.CodeGenerationController = CodeGenerationController = __decorate([
    (0, common_1.Controller)('code-generation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [code_generation_service_1.CodeGenerationService])
], CodeGenerationController);
//# sourceMappingURL=code-generation.controller.js.map