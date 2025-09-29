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
    private createProjectStructure;
    private generateEntities;
    private generateEntityClass;
    private generateAttribute;
    private generateGetter;
    private generateSetter;
    private mapToJavaType;
    private capitalize;
    private generateRepositories;
    private generateServices;
    private generateControllers;
    private generateApplicationProperties;
    private generatePomXml;
    private generateMainApplication;
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
}
