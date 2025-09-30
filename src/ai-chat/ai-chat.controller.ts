import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
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

  @Get('suggestions')
  async getSuggestions() {
    return {
      suggestions: [
        'Create an e-commerce system with products, users, and orders',
        'Design a library management system with books and borrowers',
        'Build a blog platform with users, posts, and comments',
        'Create a restaurant ordering system',
        'Design a social media platform',
        'Build a task management system',
        'Create an inventory management system',
        'Design a hotel booking system'
      ]
    };
  }

  @Get('templates')
  async getTemplates() {
    return {
      templates: [
        {
          id: 'ecommerce',
          name: 'E-commerce System',
          description: 'Complete online shopping platform with users, products, orders, and payments',
          prompt: 'Create an e-commerce system with User, Product, Category, Order, OrderItem, and Payment entities'
        },
        {
          id: 'library',
          name: 'Library Management',
          description: 'Book lending system with authors, books, borrowers, and loans',
          prompt: 'Design a library management system with Book, Author, Borrower, and Loan entities'
        },
        {
          id: 'blog',
          name: 'Blog Platform',
          description: 'Content management system with users, posts, comments, and categories',
          prompt: 'Create a blog platform with User, Post, Comment, and Category entities'
        },
        {
          id: 'restaurant',
          name: 'Restaurant Ordering',
          description: 'Food ordering system with customers, menu items, and orders',
          prompt: 'Build a restaurant ordering system with Customer, MenuItem, Order, and OrderItem entities'
        }
      ]
    };
  }
}