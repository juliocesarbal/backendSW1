"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagramModule = void 0;
const common_1 = require("@nestjs/common");
const diagram_controller_1 = require("./diagram.controller");
const diagram_service_1 = require("./diagram.service");
const prisma_module_1 = require("../prisma/prisma.module");
let DiagramModule = class DiagramModule {
};
exports.DiagramModule = DiagramModule;
exports.DiagramModule = DiagramModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [diagram_controller_1.DiagramController],
        providers: [diagram_service_1.DiagramService],
        exports: [diagram_service_1.DiagramService],
    })
], DiagramModule);
//# sourceMappingURL=diagram.module.js.map