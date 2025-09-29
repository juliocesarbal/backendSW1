import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class GenerateUMLDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  diagramId: string;
}

class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  context?: any;
}

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private aiChatService: AiChatService) {}

  @Post('generate-uml')
  async generateUML(@Body() generateUMLDto: GenerateUMLDto, @Request() req) {
    return this.aiChatService.generateUMLFromPrompt(
      generateUMLDto.prompt,
      generateUMLDto.diagramId,
      req.user.userId,
    );
  }

  @Post('chat')
  async chat(@Body() chatDto: ChatDto) {
    return this.aiChatService.chatWithAI(chatDto.message, chatDto.context);
  }
}