import { AiChatService } from './ai-chat.service';
declare class GenerateUMLDto {
    prompt: string;
    diagramId: string;
}
declare class ChatDto {
    message: string;
    diagramId?: string;
    image?: string;
}
export declare class AiChatController {
    private aiChatService;
    constructor(aiChatService: AiChatService);
    generateUML(generateUMLDto: GenerateUMLDto, req: any): Promise<{
        success: boolean;
        model: any;
        message: string;
    }>;
    chat(chatDto: ChatDto, req: any): Promise<{
        response: string;
        suggestions: string[];
        model: any;
    } | {
        response: string;
        suggestions: string[];
        model?: undefined;
    }>;
    getSuggestions(): Promise<{
        suggestions: string[];
    }>;
    getTemplates(): Promise<{
        templates: {
            id: string;
            name: string;
            description: string;
            prompt: string;
        }[];
    }>;
}
export {};
