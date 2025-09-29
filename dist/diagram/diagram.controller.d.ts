import { DiagramService } from './diagram.service';
declare class CreateDiagramDto {
    name: string;
    workspaceId: string;
}
declare class UpdateDiagramDto {
    data: any;
}
declare class AddClassDto {
    name: string;
    position?: {
        x: number;
        y: number;
    };
    attributes?: any[];
    methods?: any[];
}
export declare class DiagramController {
    private diagramService;
    constructor(diagramService: DiagramService);
    createDiagram(createDiagramDto: CreateDiagramDto, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        workspaceId: string;
        version: number;
    }>;
    getDiagramById(id: string, req: any): Promise<{
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
    updateDiagram(id: string, updateDiagramDto: UpdateDiagramDto, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        workspaceId: string;
        version: number;
    }>;
    addUMLClass(id: string, addClassDto: AddClassDto, req: any): Promise<{
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
}
export {};
