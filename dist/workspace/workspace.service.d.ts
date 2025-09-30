import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class WorkspaceService {
    private prisma;
    constructor(prisma: PrismaService);
    createWorkspace(userId: string, name: string, description?: string): Promise<{
        _count: {
            collaborators: number;
            diagrams: number;
        };
        owner: {
            email: string;
            name: string;
            id: string;
            avatar: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        ownerId: string;
    }>;
    getUserWorkspaces(userId: string): Promise<{
        owned: ({
            _count: {
                collaborators: number;
                diagrams: number;
            };
            owner: {
                email: string;
                name: string;
                id: string;
                avatar: string;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            ownerId: string;
        })[];
        collaborated: ({
            _count: {
                collaborators: number;
                diagrams: number;
            };
            owner: {
                email: string;
                name: string;
                id: string;
                avatar: string;
            };
            collaborators: {
                role: import(".prisma/client").$Enums.Role;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            ownerId: string;
        })[];
    }>;
    getWorkspaceById(workspaceId: string, userId: string): Promise<{
        owner: {
            email: string;
            name: string;
            id: string;
            avatar: string;
        };
        collaborators: ({
            user: {
                email: string;
                name: string;
                id: string;
                avatar: string;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
            userId: string;
            workspaceId: string;
        })[];
        diagrams: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue;
            version: number;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        ownerId: string;
    }>;
    addCollaborator(workspaceId: string, ownerId: string, email: string, role?: Role): Promise<{
        user: {
            email: string;
            name: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
        userId: string;
        workspaceId: string;
    }>;
}
