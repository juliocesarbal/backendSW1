"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: ['error', 'warn'],
        });
    }
    async onModuleInit() {
        let retries = 3;
        while (retries > 0) {
            try {
                await this.$connect();
                console.log('🗄️  Database connected successfully');
                return;
            }
            catch (error) {
                retries--;
                console.log(`⚠️  Database connection failed. Retries left: ${retries}`);
                if (retries === 0) {
                    console.error('❌ Failed to connect to database after 3 attempts');
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('🗄️  Database disconnected');
    }
    async retryQuery(fn, maxRetries = 2) {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (i < maxRetries) {
                    console.log(`⚠️  Query failed, retrying... (${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        throw lastError;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map