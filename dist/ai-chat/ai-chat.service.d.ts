import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class AiChatService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateUMLFromPrompt(prompt: string, diagramId: string, userId: string): Promise<{
        success: boolean;
        model: any;
        message: string;
    }>;
    private generateEcommerceModel;
    private generateLibraryModel;
    private generateBlogModel;
    private generateRestaurantModel;
    private generateHardwareStoreModel;
    private generatePharmacyModel;
    private generateGenericModel;
    private validateAndFixModel;
    private generateFallbackModel;
    chatWithAI(message: string, context?: any): Promise<{
        response: any;
        suggestions: string[];
    }>;
}
