import { Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
interface ConnectedUser {
    socketId: string;
    userId: string;
    userName: string;
    diagramId: string;
}
export declare class CollaborationService {
    private prisma;
    private connectedUsers;
    constructor(prisma: PrismaService);
    joinDiagram(client: Socket, data: {
        diagramId: string;
        userId: string;
        userName: string;
    }): Promise<boolean>;
    handleDisconnect(socketId: string): void;
    getConnectedUsers(diagramId: string): ConnectedUser[];
}
export {};
