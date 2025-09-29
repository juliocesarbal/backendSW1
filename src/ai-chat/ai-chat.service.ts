import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiChatService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateUMLFromPrompt(prompt: string, diagramId: string, userId: string) {
    try {
      // Enhanced mock UML generation based on prompt analysis
      const lowerPrompt = prompt.toLowerCase();
      let mockUMLModel;

      if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('e-commerce') || lowerPrompt.includes('shop')) {
        mockUMLModel = this.generateEcommerceModel();
      } else if (lowerPrompt.includes('library') || lowerPrompt.includes('book')) {
        mockUMLModel = this.generateLibraryModel();
      } else if (lowerPrompt.includes('blog') || lowerPrompt.includes('post')) {
        mockUMLModel = this.generateBlogModel();
      } else if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('order')) {
        mockUMLModel = this.generateRestaurantModel();
      } else {
        mockUMLModel = this.generateGenericModel(prompt);
      }

      // Log the AI generation activity
      await this.prisma.diagramActivity.create({
        data: {
          action: 'AI_GENERATION' as any,
          changes: {
            prompt,
            generatedModel: mockUMLModel,
          },
          userId,
          diagramId,
        },
      });

      return {
        success: true,
        model: mockUMLModel,
        message: 'UML model generated successfully',
      };
    } catch (error) {
      console.error('Error generating UML model:', error);
      throw new Error('Failed to generate UML model');
    }
  }

  private generateEcommerceModel() {
    return {
      name: 'E-commerce System',
      classes: [
        {
          id: 'cls_user',
          name: 'User',
          position: { x: 100, y: 100 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'email', type: 'String', nullable: false, unique: true },
            { id: 'attr_3', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_4', name: 'password', type: 'String', nullable: false, unique: false },
            { id: 'attr_5', name: 'address', type: 'String', nullable: true, unique: false },
          ],
          methods: [
            { id: 'method_1', name: 'login', returnType: 'Boolean', parameters: [], visibility: 'public' },
            { id: 'method_2', name: 'updateProfile', returnType: 'void', parameters: [], visibility: 'public' },
          ],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_product',
          name: 'Product',
          position: { x: 400, y: 100 },
          attributes: [
            { id: 'attr_6', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_7', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_8', name: 'description', type: 'String', nullable: true, unique: false },
            { id: 'attr_9', name: 'price', type: 'BigDecimal', nullable: false, unique: false },
            { id: 'attr_10', name: 'stock', type: 'Integer', nullable: false, unique: false },
          ],
          methods: [
            { id: 'method_3', name: 'updateStock', returnType: 'void', parameters: [], visibility: 'public' },
            { id: 'method_4', name: 'calculateDiscount', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
          ],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_category',
          name: 'Category',
          position: { x: 700, y: 100 },
          attributes: [
            { id: 'attr_11', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_12', name: 'name', type: 'String', nullable: false, unique: true },
            { id: 'attr_13', name: 'description', type: 'String', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_order',
          name: 'Order',
          position: { x: 250, y: 350 },
          attributes: [
            { id: 'attr_14', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_15', name: 'orderDate', type: 'LocalDateTime', nullable: false, unique: false },
            { id: 'attr_16', name: 'status', type: 'String', nullable: false, unique: false },
            { id: 'attr_17', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
          ],
          methods: [
            { id: 'method_5', name: 'calculateTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
            { id: 'method_6', name: 'updateStatus', returnType: 'void', parameters: [], visibility: 'public' },
          ],
          stereotypes: ['entity'],
        },
      ],
      relations: [
        {
          id: 'rel_1',
          sourceClassId: 'cls_product',
          targetClassId: 'cls_category',
          type: 'ManyToOne',
          name: 'category',
        },
        {
          id: 'rel_2',
          sourceClassId: 'cls_order',
          targetClassId: 'cls_user',
          type: 'ManyToOne',
          name: 'customer',
        },
      ],
    };
  }

  private generateLibraryModel() {
    return {
      name: 'Library Management System',
      classes: [
        {
          id: 'cls_book',
          name: 'Book',
          position: { x: 100, y: 100 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'isbn', type: 'String', nullable: false, unique: true },
            { id: 'attr_3', name: 'title', type: 'String', nullable: false, unique: false },
            { id: 'attr_4', name: 'publishedDate', type: 'LocalDate', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_author',
          name: 'Author',
          position: { x: 400, y: 100 },
          attributes: [
            { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_6', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_7', name: 'biography', type: 'String', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_borrower',
          name: 'Borrower',
          position: { x: 100, y: 350 },
          attributes: [
            { id: 'attr_8', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_9', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_10', name: 'email', type: 'String', nullable: false, unique: true },
            { id: 'attr_11', name: 'membershipDate', type: 'LocalDate', nullable: false, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
      ],
      relations: [
        {
          id: 'rel_1',
          sourceClassId: 'cls_book',
          targetClassId: 'cls_author',
          type: 'ManyToOne',
          name: 'author',
        },
      ],
    };
  }

  private generateBlogModel() {
    return {
      name: 'Blog Platform',
      classes: [
        {
          id: 'cls_user',
          name: 'User',
          position: { x: 100, y: 100 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'username', type: 'String', nullable: false, unique: true },
            { id: 'attr_3', name: 'email', type: 'String', nullable: false, unique: true },
            { id: 'attr_4', name: 'bio', type: 'String', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_post',
          name: 'Post',
          position: { x: 400, y: 100 },
          attributes: [
            { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_6', name: 'title', type: 'String', nullable: false, unique: false },
            { id: 'attr_7', name: 'content', type: 'String', nullable: false, unique: false },
            { id: 'attr_8', name: 'publishedAt', type: 'LocalDateTime', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_comment',
          name: 'Comment',
          position: { x: 400, y: 350 },
          attributes: [
            { id: 'attr_9', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_10', name: 'content', type: 'String', nullable: false, unique: false },
            { id: 'attr_11', name: 'createdAt', type: 'LocalDateTime', nullable: false, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
      ],
      relations: [
        {
          id: 'rel_1',
          sourceClassId: 'cls_post',
          targetClassId: 'cls_user',
          type: 'ManyToOne',
          name: 'author',
        },
        {
          id: 'rel_2',
          sourceClassId: 'cls_comment',
          targetClassId: 'cls_post',
          type: 'ManyToOne',
          name: 'post',
        },
        {
          id: 'rel_3',
          sourceClassId: 'cls_comment',
          targetClassId: 'cls_user',
          type: 'ManyToOne',
          name: 'author',
        },
      ],
    };
  }

  private generateRestaurantModel() {
    return {
      name: 'Restaurant Ordering System',
      classes: [
        {
          id: 'cls_customer',
          name: 'Customer',
          position: { x: 100, y: 100 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_3', name: 'phone', type: 'String', nullable: false, unique: false },
            { id: 'attr_4', name: 'address', type: 'String', nullable: true, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_menuitem',
          name: 'MenuItem',
          position: { x: 400, y: 100 },
          attributes: [
            { id: 'attr_5', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_6', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_7', name: 'description', type: 'String', nullable: true, unique: false },
            { id: 'attr_8', name: 'price', type: 'BigDecimal', nullable: false, unique: false },
            { id: 'attr_9', name: 'category', type: 'String', nullable: false, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
        {
          id: 'cls_order',
          name: 'Order',
          position: { x: 250, y: 350 },
          attributes: [
            { id: 'attr_10', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_11', name: 'orderTime', type: 'LocalDateTime', nullable: false, unique: false },
            { id: 'attr_12', name: 'status', type: 'String', nullable: false, unique: false },
            { id: 'attr_13', name: 'total', type: 'BigDecimal', nullable: false, unique: false },
          ],
          methods: [
            { id: 'method_1', name: 'calculateTotal', returnType: 'BigDecimal', parameters: [], visibility: 'public' },
          ],
          stereotypes: ['entity'],
        },
      ],
      relations: [
        {
          id: 'rel_1',
          sourceClassId: 'cls_order',
          targetClassId: 'cls_customer',
          type: 'ManyToOne',
          name: 'customer',
        },
      ],
    };
  }

  private generateGenericModel(prompt: string) {
    return {
      name: 'Generated Model',
      classes: [
        {
          id: 'cls_entity',
          name: 'Entity',
          position: { x: 200, y: 200 },
          attributes: [
            { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
            { id: 'attr_2', name: 'name', type: 'String', nullable: false, unique: false },
            { id: 'attr_3', name: 'createdAt', type: 'LocalDateTime', nullable: false, unique: false },
          ],
          methods: [],
          stereotypes: ['entity'],
        },
      ],
      relations: [],
    };
  }

  async chatWithAI(message: string, context?: any) {
    // Placeholder for OpenAI chat implementation
    return {
      response: `I understand you want to: "${message}". Let me help you create a UML diagram for that.`,
      suggestions: [
        'Create a User class with basic attributes',
        'Add relationships between entities',
        'Generate a complete e-commerce model',
      ],
    };
  }
}