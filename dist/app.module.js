"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const workspace_module_1 = require("./workspace/workspace.module");
const diagram_module_1 = require("./diagram/diagram.module");
const collaboration_module_1 = require("./collaboration/collaboration.module");
const ai_chat_module_1 = require("./ai-chat/ai-chat.module");
const code_generation_module_1 = require("./code-generation/code-generation.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            workspace_module_1.WorkspaceModule,
            diagram_module_1.DiagramModule,
            collaboration_module_1.CollaborationModule,
            ai_chat_module_1.AiChatModule,
            code_generation_module_1.CodeGenerationModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map