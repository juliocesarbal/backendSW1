import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DiagramService } from '../diagram/diagram.service';
export declare class AiChatService {
    private prisma;
    private configService;
    private diagramService;
    private anthropic;
    private readonly CLAUDE_MODEL_MAIN;
    private readonly CLAUDE_MODEL_FAST;
    private readonly MaxTokens;
    constructor(prisma: PrismaService, configService: ConfigService, diagramService: DiagramService);
    generateUMLFromPrompt(prompt: string, diagramId: string, userId: string): Promise<{
        success: boolean;
        model: any;
        message: string;
    }>;
    private generateGenericModel;
    private validateAndFixModel;
    private generateFallbackModel;
    chatWithAI(message: string, diagramId?: string, userId?: string, imageBase64?: string): Promise<{
        response: string;
        suggestions: string[];
        model: any;
    } | {
        response: string;
        suggestions: string[];
        model?: undefined;
    }>;
}
