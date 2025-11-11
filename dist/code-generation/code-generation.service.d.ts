import { PrismaService } from '../prisma/prisma.service';
export declare class CodeGenerationService {
    private prisma;
    constructor(prisma: PrismaService);
    generateSpringBootProject(diagramId: string, userId: string): Promise<{
        success: boolean;
        projectPath: string;
        zipPath: string;
        generatedCodeId: string;
        message: string;
    }>;
    generateFlutterProject(diagramId: string, userId: string): Promise<{
        success: boolean;
        projectPath: string;
        zipPath: string;
        generatedCodeId: string;
        message: string;
    }>;
    private validateAndNormalizeDiagram;
    private transformClasses;
    private transformAttributes;
    private analyzeMultiplicity;
    private mapRelationType;
    private mapToJavaType;
    private getSampleValue;
    private toCamelCase;
    private pluralize;
    private capitalize;
    private createProjectStructure;
    private generateFromTemplates;
    private generateClassFiles;
    private renderTemplate;
    private createZipFile;
    downloadProject(generatedCodeId: string): Promise<string>;
    getGeneratedProjects(userId: string): Promise<({
        diagram: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        diagramId: string;
        projectType: import(".prisma/client").$Enums.ProjectType;
        zipPath: string;
        generatedAt: Date;
        generatedBy: string;
    })[]>;
    private createFlutterProjectStructure;
    private generateFlutterFromTemplates;
    private generateFlutterClassFiles;
}
