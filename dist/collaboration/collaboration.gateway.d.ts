import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CollaborationService } from './collaboration.service';
export declare class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private collaborationService;
    server: Server;
    constructor(collaborationService: CollaborationService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinDiagram(client: Socket, data: {
        diagramId: string;
        userId: string;
        userName: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleLeaveDiagram(client: Socket, data: {
        diagramId: string;
        userId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleDiagramChange(client: Socket, data: {
        diagramId: string;
        changes: any;
        userId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleCursorPosition(client: Socket, data: {
        diagramId: string;
        position: {
            x: number;
            y: number;
        };
        userId: string;
    }): Promise<void>;
    handleElementSelected(client: Socket, data: {
        diagramId: string;
        elementId: string;
        userId: string;
    }): Promise<void>;
}
