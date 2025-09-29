import { AiChatService } from './ai-chat.service';
declare class GenerateUMLDto {
    prompt: string;
    diagramId: string;
}
declare class ChatDto {
    message: string;
    context?: any;
}
export declare class AiChatController {
    private aiChatService;
    constructor(aiChatService: AiChatService);
    generateUML(generateUMLDto: GenerateUMLDto, req: any): Promise<{
        success: boolean;
        model: any;
        message: string;
    }>;
    chat(chatDto: ChatDto): Promise<{
        response: string;
        suggestions: string[];
    }>;
}
export {};
