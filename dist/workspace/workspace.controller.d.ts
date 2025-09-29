import { WorkspaceService } from './workspace.service';
import { Role } from '@prisma/client';
declare class CreateWorkspaceDto {
    name: string;
    description?: string;
}
declare class AddCollaboratorDto {
    email: string;
    role?: Role;
}
export declare class WorkspaceController {
    private workspaceService;
    constructor(workspaceService: WorkspaceService);
    createWorkspace(createWorkspaceDto: CreateWorkspaceDto, req: any): Promise<{
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
    getUserWorkspaces(req: any): Promise<{
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
    getWorkspaceById(id: string, req: any): Promise<{
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
    addCollaborator(id: string, addCollaboratorDto: AddCollaboratorDto, req: any): Promise<{
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
export {};
