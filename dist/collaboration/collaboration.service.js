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
exports.CollaborationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollaborationService = class CollaborationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.connectedUsers = new Map();
    }
    async joinDiagram(client, data) {
        const diagram = await this.prisma.diagram.findUnique({
            where: { id: data.diagramId },
            include: {
                workspace: {
                    include: {
                        collaborators: true,
                    },
                },
            },
        });
        if (!diagram) {
            throw new Error('Diagram not found');
        }
        const hasAccess = diagram.workspace.ownerId === data.userId ||
            diagram.workspace.collaborators.some(c => c.userId === data.userId);
        if (!hasAccess) {
            throw new Error('Access denied to this diagram');
        }
        client.join(data.diagramId);
        this.connectedUsers.set(client.id, {
            socketId: client.id,
            userId: data.userId,
            userName: data.userName,
            diagramId: data.diagramId,
        });
        return true;
    }
    handleDisconnect(socketId) {
        const user = this.connectedUsers.get(socketId);
        if (user) {
            this.connectedUsers.delete(socketId);
        }
    }
    getConnectedUsers(diagramId) {
        return Array.from(this.connectedUsers.values())
            .filter(user => user.diagramId === diagramId);
    }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollaborationService);
//# sourceMappingURL=collaboration.service.js.map