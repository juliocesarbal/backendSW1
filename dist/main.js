"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const port = configService.get('PORT', 3001);
    const server = await app.listen(port);
    server.setTimeout(180000);
    console.log(`🚀 UML Platform Backend running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map