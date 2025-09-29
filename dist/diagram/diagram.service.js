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
exports.DiagramService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DiagramService = class DiagramService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDiagram(workspaceId, userId, name) {
        await this.verifyWorkspaceAccess(workspaceId, userId);
        return this.prisma.diagram.create({
            data: {
                name,
                workspaceId,
                data: {
                    classes: [],
                    relations: [],
                    metadata: {
                        createdBy: userId,
                        createdAt: new Date().toISOString(),
                    },
                },
            },
        });
    }
    async getDiagramById(diagramId, userId) {
        const diagram = await this.prisma.diagram.findUnique({
            where: { id: diagramId },
            include: {
                workspace: {
                    include: {
                        collaborators: true,
                    },
                },
                classes: {
                    include: {
                        attributes: true,
                        methods: true,
                    },
                },
                relations: true,
            },
        });
        if (!diagram) {
            throw new common_1.NotFoundException('Diagram not found');
        }
        const hasAccess = diagram.workspace.ownerId === userId ||
            diagram.workspace.collaborators.some(c => c.userId === userId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Access denied to this diagram');
        }
        return diagram;
    }
    async updateDiagram(diagramId, userId, data) {
        await this.getDiagramById(diagramId, userId);
        const updatedDiagram = await this.prisma.diagram.update({
            where: { id: diagramId },
            data: {
                data,
                version: { increment: 1 },
            },
        });
        await this.prisma.diagramActivity.create({
            data: {
                action: client_1.ActivityType.UPDATE_CLASS,
                changes: data,
                userId,
                diagramId,
            },
        });
        return updatedDiagram;
    }
    async addUMLClass(diagramId, userId, classData) {
        await this.getDiagramById(diagramId, userId);
        const umlClass = await this.prisma.uMLClass.create({
            data: {
                name: classData.name,
                position: classData.position || { x: 0, y: 0 },
                diagramId,
            },
        });
        if (classData.attributes && classData.attributes.length > 0) {
            await this.prisma.uMLAttribute.createMany({
                data: classData.attributes.map((attr) => ({
                    ...attr,
                    classId: umlClass.id,
                })),
            });
        }
        if (classData.methods && classData.methods.length > 0) {
            await this.prisma.uMLMethod.createMany({
                data: classData.methods.map((method) => ({
                    ...method,
                    classId: umlClass.id,
                })),
            });
        }
        await this.prisma.diagramActivity.create({
            data: {
                action: client_1.ActivityType.CREATE_CLASS,
                changes: classData,
                userId,
                diagramId,
            },
        });
        return this.prisma.uMLClass.findUnique({
            where: { id: umlClass.id },
            include: {
                attributes: true,
                methods: true,
            },
        });
    }
    async verifyWorkspaceAccess(workspaceId, userId) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                collaborators: true,
            },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        const hasAccess = workspace.ownerId === userId ||
            workspace.collaborators.some(c => c.userId === userId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Access denied to this workspace');
        }
        return workspace;
    }
};
exports.DiagramService = DiagramService;
exports.DiagramService = DiagramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiagramService);
//# sourceMappingURL=diagram.service.js.map