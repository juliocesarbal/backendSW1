import { PrismaService } from '../prisma/prisma.service';
export declare class DiagramService {
    private prisma;
    constructor(prisma: PrismaService);
    createDiagram(workspaceId: string, userId: string, name: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        workspaceId: string;
        version: number;
    }>;
    getDiagramById(diagramId: string, userId: string): Promise<{
        workspace: {
            collaborators: {
                id: string;
                role: import(".prisma/client").$Enums.Role;
                joinedAt: Date;
                userId: string;
                workspaceId: string;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            ownerId: string;
        };
        classes: ({
            attributes: {
                name: string;
                id: string;
                type: string;
                multiplicity: string | null;
                stereotype: string | null;
                nullable: boolean;
                unique: boolean;
                classId: string;
            }[];
            methods: {
                name: string;
                id: string;
                classId: string;
                returnType: string;
                parameters: import("@prisma/client/runtime/library").JsonValue;
                visibility: string;
            }[];
        } & {
            name: string;
            id: string;
            diagramId: string;
            position: import("@prisma/client/runtime/library").JsonValue;
        })[];
        relations: {
            name: string | null;
            id: string;
            diagramId: string;
            type: import(".prisma/client").$Enums.RelationType;
            multiplicity: string | null;
            sourceClassId: string;
            targetClassId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        workspaceId: string;
        version: number;
    }>;
    updateDiagram(diagramId: string, userId: string, data: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        workspaceId: string;
        version: number;
    }>;
    addUMLClass(diagramId: string, userId: string, classData: any): Promise<{
        attributes: {
            name: string;
            id: string;
            type: string;
            multiplicity: string | null;
            stereotype: string | null;
            nullable: boolean;
            unique: boolean;
            classId: string;
        }[];
        methods: {
            name: string;
            id: string;
            classId: string;
            returnType: string;
            parameters: import("@prisma/client/runtime/library").JsonValue;
            visibility: string;
        }[];
    } & {
        name: string;
        id: string;
        diagramId: string;
        position: import("@prisma/client/runtime/library").JsonValue;
    }>;
    deleteDiagram(diagramId: string, userId: string): Promise<{
        message: string;
    }>;
    private verifyWorkspaceAccess;
}
