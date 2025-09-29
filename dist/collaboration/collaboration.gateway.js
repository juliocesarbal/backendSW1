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
exports.CollaborationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const collaboration_service_1 = require("./collaboration.service");
let CollaborationGateway = class CollaborationGateway {
    constructor(collaborationService) {
        this.collaborationService = collaborationService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.collaborationService.handleDisconnect(client.id);
    }
    async handleJoinDiagram(client, data) {
        try {
            await this.collaborationService.joinDiagram(client, data);
            client.to(data.diagramId).emit('user_joined', {
                userId: data.userId,
                userName: data.userName,
                socketId: client.id,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleLeaveDiagram(client, data) {
        client.leave(data.diagramId);
        client.to(data.diagramId).emit('user_left', {
            userId: data.userId,
            socketId: client.id,
        });
        return { success: true };
    }
    async handleDiagramChange(client, data) {
        client.to(data.diagramId).emit('diagram_change', {
            changes: data.changes,
            userId: data.userId,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    async handleCursorPosition(client, data) {
        client.to(data.diagramId).emit('cursor_position', {
            position: data.position,
            userId: data.userId,
            socketId: client.id,
        });
    }
    async handleElementSelected(client, data) {
        client.to(data.diagramId).emit('element_selected', {
            elementId: data.elementId,
            userId: data.userId,
            socketId: client.id,
        });
    }
};
exports.CollaborationGateway = CollaborationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CollaborationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_diagram'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleJoinDiagram", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_diagram'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleLeaveDiagram", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diagram_change'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleDiagramChange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cursor_position'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleCursorPosition", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('element_selected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleElementSelected", null);
exports.CollaborationGateway = CollaborationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/collaboration',
    }),
    __metadata("design:paramtypes", [collaboration_service_1.CollaborationService])
], CollaborationGateway);
//# sourceMappingURL=collaboration.gateway.js.map