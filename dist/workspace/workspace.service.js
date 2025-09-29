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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let WorkspaceService = class WorkspaceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWorkspace(userId, name, description) {
        return this.prisma.workspace.create({
            data: {
                name,
                description,
                ownerId: userId,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        collaborators: true,
                        diagrams: true,
                    },
                },
            },
        });
    }
    async getUserWorkspaces(userId) {
        const ownedWorkspaces = await this.prisma.workspace.findMany({
            where: { ownerId: userId },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        collaborators: true,
                        diagrams: true,
                    },
                },
            },
        });
        const collaboratedWorkspaces = await this.prisma.workspace.findMany({
            where: {
                collaborators: {
                    some: { userId },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                collaborators: {
                    where: { userId },
                    select: { role: true },
                },
                _count: {
                    select: {
                        collaborators: true,
                        diagrams: true,
                    },
                },
            },
        });
        return {
            owned: ownedWorkspaces,
            collaborated: collaboratedWorkspaces,
        };
    }
    async getWorkspaceById(workspaceId, userId) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
                diagrams: {
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        version: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
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
    async addCollaborator(workspaceId, ownerId, email, role = client_1.Role.VIEWER) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId, ownerId },
        });
        if (!workspace) {
            throw new common_1.ForbiddenException('Only workspace owner can add collaborators');
        }
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingCollaborator = await this.prisma.workspaceCollaborator.findUnique({
            where: {
                userId_workspaceId: {
                    userId: user.id,
                    workspaceId,
                },
            },
        });
        if (existingCollaborator) {
            throw new common_1.ForbiddenException('User is already a collaborator');
        }
        return this.prisma.workspaceCollaborator.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map