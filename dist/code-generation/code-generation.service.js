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
exports.CodeGenerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const fs = require("fs/promises");
const path = require("path");
const archiver = require("archiver");
const fs_1 = require("fs");
const ejs = require("ejs");
let CodeGenerationService = class CodeGenerationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateSpringBootProject(diagramId, userId) {
        console.log(`🚀 Generating Spring Boot project for diagram: ${diagramId}`);
        const diagram = await this.prisma.retryQuery(() => this.prisma.diagram.findUnique({
            where: { id: diagramId },
        }));
        if (!diagram) {
            throw new common_1.BadRequestException('Diagram not found');
        }
        const diagramData = diagram.data;
        const classes = diagramData.classes || [];
        const relations = diagramData.relations || [];
        console.log(`📊 Diagram found: ${diagram.name}`);
        console.log(`📦 Classes count: ${classes.length}`);
        console.log(`🔗 Relations count: ${relations.length}`);
        this.validateAndNormalizeDiagram(classes);
        const projectName = diagram.name.toLowerCase().replace(/\s+/g, '-');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const projectPath = `./generated-projects/${projectName}-${timestamp}`;
        const basePackage = `com.example.${projectName.replace(/-/g, '')}`;
        const dbName = projectName.replace(/-/g, '_');
        console.log(`📁 Project path: ${projectPath}`);
        console.log(`📦 Base package: ${basePackage}`);
        try {
            await this.createProjectStructure(projectPath, projectName);
            console.log('✅ Project structure created');
            const transformedClasses = this.transformClasses(classes, relations);
            console.log(`✅ Transformed ${transformedClasses.length} classes`);
            await this.generateFromTemplates(projectPath, {
                projectName,
                basePackage,
                dbName,
                classes: transformedClasses,
                relations,
            });
            console.log('✅ Files generated from templates');
            const zipPath = `${projectPath}.zip`;
            await this.createZipFile(projectPath, zipPath);
            console.log(`✅ ZIP file created: ${zipPath}`);
            const generatedCode = await this.prisma.retryQuery(() => this.prisma.generatedCode.create({
                data: {
                    projectType: client_1.ProjectType.SPRING_BOOT,
                    zipPath: zipPath,
                    diagramId,
                    generatedBy: userId,
                },
            }));
            return {
                success: true,
                projectPath,
                zipPath,
                generatedCodeId: generatedCode.id,
                message: 'Spring Boot project generated successfully with tests and Docker configuration',
            };
        }
        catch (error) {
            console.error('❌ Error generating project:', error);
            console.error('Stack trace:', error.stack);
            throw new Error(`Failed to generate Spring Boot project: ${error.message}`);
        }
    }
    validateAndNormalizeDiagram(classes) {
        if (!classes || classes.length === 0) {
            throw new common_1.BadRequestException('Diagram must contain at least one class');
        }
        console.log('🔍 Validating and normalizing diagram...');
        for (const umlClass of classes) {
            if (!umlClass.attributes) {
                umlClass.attributes = [];
            }
            console.log(`  Checking class: ${umlClass.name}, attributes: ${umlClass.attributes.length}`);
            const hasId = umlClass.attributes.some((attr) => attr.stereotype === 'id');
            if (!hasId) {
                console.log(`  ⚠️  No ID found for ${umlClass.name}, adding default 'id' attribute`);
                umlClass.attributes.unshift({
                    id: `${umlClass.id}_id_attr`,
                    name: 'id',
                    type: 'Long',
                    stereotype: 'id',
                    nullable: false,
                    unique: true,
                });
            }
        }
        console.log('✅ Diagram validated and normalized');
    }
    transformClasses(umlClasses, relations) {
        return umlClasses.map((umlClass) => {
            const className = umlClass.name;
            const varName = className.charAt(0).toLowerCase() + className.slice(1);
            const pluralName = this.pluralize(className.toLowerCase());
            const tableName = className.toLowerCase();
            const idAttribute = umlClass.attributes.find((attr) => attr.stereotype === 'id');
            const idType = idAttribute ? this.mapToJavaType(idAttribute.type) : 'Long';
            const attributes = this.transformAttributes(umlClass.attributes, umlClass.id, className, relations, umlClasses);
            const uniqueFields = attributes
                .filter((attr) => attr.unique && !attr.isId)
                .map((attr) => ({
                name: attr.name,
                type: attr.type,
            }));
            const sampleData = attributes
                .filter((attr) => !attr.isId && !attr.isRelation)
                .slice(0, 3)
                .map((attr) => ({
                key: attr.name,
                value: attr.sampleValue,
            }));
            return {
                className,
                varName,
                pluralName,
                tableName,
                idType,
                attributes,
                uniqueFields,
                sampleData,
            };
        });
    }
    transformAttributes(attributes, classId, className, relations, allClasses) {
        const result = [];
        for (const attr of attributes) {
            const isId = attr.stereotype === 'id';
            const isFk = attr.stereotype === 'fk';
            if (isFk) {
                console.log(`⏭️  Skipping FK attribute: ${attr.name} (will be generated by relation)`);
                continue;
            }
            const javaType = this.mapToJavaType(attr.type);
            result.push({
                name: attr.name,
                type: javaType,
                columnName: attr.name.toLowerCase(),
                nullable: attr.nullable !== false,
                unique: attr.unique === true,
                isId,
                isRelation: false,
                length: attr.type === 'String' ? 255 : null,
                sampleValue: this.getSampleValue(javaType),
            });
        }
        const classRelations = relations.filter((r) => r.sourceClassId === classId || r.targetClassId === classId);
        for (const relation of classRelations) {
            const isSource = relation.sourceClassId === classId;
            const targetClassId = isSource ? relation.targetClassId : relation.sourceClassId;
            const targetClass = allClasses.find(c => c.id === targetClassId);
            if (!targetClass) {
                console.warn(`⚠️  Target class not found for relation: ${relation.id}`);
                continue;
            }
            const targetClassName = targetClass.name;
            const multiplicityAnalysis = this.analyzeMultiplicity(relation, isSource);
            const relationType = multiplicityAnalysis.type;
            const relationName = relation.name || targetClassName.toLowerCase();
            console.log(`📊 [${className}] relation.name="${relation.name}", relationName="${relationName}", type=${relation.type}->${relationType}, target=${targetClassName}, multiplicity=${JSON.stringify(relation.multiplicity)}`);
            if (relationType === 'MANY_TO_ONE') {
                result.push({
                    name: relationName,
                    type: targetClassName,
                    columnName: `${targetClassName.toLowerCase()}_id`,
                    nullable: true,
                    unique: false,
                    isId: false,
                    isRelation: true,
                    relationType: 'MANY_TO_ONE',
                    foreignKey: {
                        referencedTable: targetClass.name.toLowerCase(),
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE',
                    },
                });
            }
            else if (relationType === 'ONE_TO_MANY') {
                const mappedByField = relation.name || className.toLowerCase();
                console.log(`🔗 ONE_TO_MANY: ${className}.${relationName} -> ${targetClassName}, mappedBy="${mappedByField}"`);
                result.push({
                    name: relationName || `${targetClassName.toLowerCase()}s`,
                    type: `List<${targetClassName}>`,
                    nullable: true,
                    unique: false,
                    isId: false,
                    isRelation: true,
                    relationType: 'ONE_TO_MANY',
                    mappedBy: mappedByField,
                });
            }
            else if (relationType === 'MANY_TO_MANY') {
                let joinTableName;
                if (relation.intermediateTable && relation.intermediateTable.name) {
                    joinTableName = relation.intermediateTable.name.toLowerCase();
                    console.log(`🔗 Using explicit intermediate table name: ${joinTableName}`);
                    if (relation.intermediateTable.attributes) {
                        console.log(`   Attributes:`, relation.intermediateTable.attributes);
                    }
                }
                else {
                    const tables = [className.toLowerCase(), targetClassName.toLowerCase()].sort();
                    joinTableName = `${tables[0]}_${tables[1]}`;
                    console.log(`🔗 Generated join table name (alphabetically sorted): ${joinTableName}`);
                }
                result.push({
                    name: relationName || `${targetClassName.toLowerCase()}s`,
                    type: `Set<${targetClassName}>`,
                    nullable: true,
                    unique: false,
                    isId: false,
                    isRelation: true,
                    relationType: 'MANY_TO_MANY',
                    joinTable: joinTableName,
                    joinColumn: `${className.toLowerCase()}_id`,
                    inverseJoinColumn: `${targetClassName.toLowerCase()}_id`,
                    foreignKey: {
                        referencedTable: targetClass.name.toLowerCase(),
                    },
                    intermediateTableData: relation.intermediateTable,
                });
            }
            else if (relationType === 'ONE_TO_ONE') {
                result.push({
                    name: relationName,
                    type: targetClassName,
                    columnName: `${targetClassName.toLowerCase()}_id`,
                    nullable: true,
                    unique: false,
                    isId: false,
                    isRelation: true,
                    relationType: 'ONE_TO_ONE',
                    foreignKey: {
                        referencedTable: targetClass.name.toLowerCase(),
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE',
                    },
                });
            }
        }
        return result;
    }
    analyzeMultiplicity(relation, isSource) {
        let sourceMultiplicity = '1';
        let targetMultiplicity = '1';
        if (relation.multiplicity) {
            if (typeof relation.multiplicity === 'string' && relation.multiplicity.includes(':')) {
                const parts = relation.multiplicity.split(':');
                sourceMultiplicity = parts[0] || '1';
                targetMultiplicity = parts[1] || '1';
            }
            else if (typeof relation.multiplicity === 'object') {
                sourceMultiplicity = relation.multiplicity.source || '1';
                targetMultiplicity = relation.multiplicity.target || '1';
            }
        }
        const isMany = (mult) => mult.includes('*') || mult.includes('n') || mult.includes('N');
        const sourceIsMany = isMany(sourceMultiplicity);
        const targetIsMany = isMany(targetMultiplicity);
        if (sourceIsMany && targetIsMany) {
            return { type: 'MANY_TO_MANY', needsFk: false };
        }
        else if (sourceIsMany && !targetIsMany) {
            if (isSource) {
                return { type: 'MANY_TO_ONE', needsFk: true };
            }
            else {
                return { type: 'ONE_TO_MANY', needsFk: false };
            }
        }
        else if (!sourceIsMany && targetIsMany) {
            if (isSource) {
                return { type: 'ONE_TO_MANY', needsFk: false };
            }
            else {
                return { type: 'MANY_TO_ONE', needsFk: true };
            }
        }
        else {
            return { type: 'ONE_TO_ONE', needsFk: isSource };
        }
    }
    mapRelationType(relationType, isSource) {
        const normalizedType = relationType.toUpperCase().replace(/-/g, '_');
        switch (normalizedType) {
            case 'MANYTOMANY':
            case 'MANY_TO_MANY':
                return 'MANY_TO_MANY';
            case 'ONETOMANY':
            case 'ONE_TO_MANY':
                return isSource ? 'ONE_TO_MANY' : 'MANY_TO_ONE';
            case 'MANYTOONE':
            case 'MANY_TO_ONE':
                return isSource ? 'MANY_TO_ONE' : 'ONE_TO_MANY';
            case 'ONETOONE':
            case 'ONE_TO_ONE':
                return 'ONE_TO_ONE';
            case 'ASSOCIATION':
                return isSource ? 'MANY_TO_ONE' : 'ONE_TO_MANY';
            case 'COMPOSITION':
            case 'AGGREGATION':
                return isSource ? 'ONE_TO_MANY' : 'MANY_TO_ONE';
            case 'INHERITANCE':
                return 'INHERITANCE';
            default:
                console.warn(`⚠️  Unknown relation type: ${relationType}, defaulting to MANY_TO_ONE`);
                return 'MANY_TO_ONE';
        }
    }
    mapToJavaType(umlType) {
        const typeMap = {
            String: 'String',
            Integer: 'Integer',
            Long: 'Long',
            BigDecimal: 'BigDecimal',
            Boolean: 'Boolean',
            LocalDate: 'LocalDate',
            LocalDateTime: 'LocalDateTime',
            Double: 'Double',
            Float: 'Float',
        };
        return typeMap[umlType] || 'String';
    }
    getSampleValue(javaType) {
        const sampleMap = {
            String: '"Sample String"',
            Integer: '123',
            Long: '123L',
            BigDecimal: 'new BigDecimal("99.99")',
            Boolean: 'true',
            LocalDate: 'LocalDate.now()',
            LocalDateTime: 'LocalDateTime.now()',
            Double: '99.99',
            Float: '99.99f',
        };
        return sampleMap[javaType] || '""';
    }
    pluralize(word) {
        if (word.endsWith('y')) {
            return word.slice(0, -1) + 'ies';
        }
        else if (word.endsWith('s')) {
            return word + 'es';
        }
        else {
            return word + 's';
        }
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    async createProjectStructure(projectPath, projectName) {
        const basePackage = `src/main/java/com/example/${projectName.replace(/-/g, '')}`;
        const resourcesPath = 'src/main/resources';
        const testPath = `src/test/java/com/example/${projectName.replace(/-/g, '')}`;
        const directories = [
            `${projectPath}/${basePackage}/entity`,
            `${projectPath}/${basePackage}/repository`,
            `${projectPath}/${basePackage}/service`,
            `${projectPath}/${basePackage}/controller`,
            `${projectPath}/${basePackage}/dto`,
            `${projectPath}/${basePackage}/exception`,
            `${projectPath}/${resourcesPath}`,
            `${projectPath}/${testPath}/controller`,
        ];
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async generateFromTemplates(projectPath, data) {
        const templatesDir = path.join(__dirname, '../../templates/springboot');
        const { projectName, basePackage, dbName, classes } = data;
        const className = this.capitalize(projectName.replace(/-/g, ''));
        await this.renderTemplate(path.join(templatesDir, 'pom.xml.ejs'), path.join(projectPath, 'pom.xml'), { projectName });
        const appPath = `src/main/java/${basePackage.replace(/\./g, '/')}/`;
        await this.renderTemplate(path.join(templatesDir, 'Application.java.ejs'), path.join(projectPath, appPath, `${className}Application.java`), { basePackage, className });
        await this.renderTemplate(path.join(templatesDir, 'application.properties.ejs'), path.join(projectPath, 'src/main/resources/application.properties'), { projectName, dbName });
        await this.renderTemplate(path.join(templatesDir, 'database.sql.ejs'), path.join(projectPath, 'database.sql'), { projectName, dbName, classes });
        await this.renderTemplate(path.join(templatesDir, 'setup-database.bat.ejs'), path.join(projectPath, 'setup-database.bat'), { projectName, dbName, classes });
        await this.renderTemplate(path.join(templatesDir, '.env.example'), path.join(projectPath, '.env.example'), { projectName, dbName });
        await this.renderTemplate(path.join(templatesDir, '.env.ejs'), path.join(projectPath, '.env'), { projectName, dbName });
        await this.renderTemplate(path.join(templatesDir, 'README.md.ejs'), path.join(projectPath, 'README.md'), { projectName, basePackage, dbName, classes });
        await this.renderTemplate(path.join(templatesDir, '.gitignore.ejs'), path.join(projectPath, '.gitignore'), { projectName, dbName });
        await this.renderTemplate(path.join(templatesDir, 'Endpoints.md.ejs'), path.join(projectPath, 'Endpoints.md'), { projectName, classes });
        const exceptionPath = `src/main/java/${basePackage.replace(/\./g, '/')}/exception/`;
        await this.renderTemplate(path.join(templatesDir, 'GlobalExceptionHandler.java.ejs'), path.join(projectPath, exceptionPath, 'GlobalExceptionHandler.java'), { basePackage });
        await this.renderTemplate(path.join(templatesDir, 'ResourceNotFoundException.java.ejs'), path.join(projectPath, exceptionPath, 'ResourceNotFoundException.java'), { basePackage });
        for (const cls of classes) {
            await this.generateClassFiles(projectPath, basePackage, cls);
        }
    }
    async generateClassFiles(projectPath, basePackage, classData) {
        const templatesDir = path.join(__dirname, '../../templates/springboot');
        const basePath = basePackage.replace(/\./g, '/');
        const templateData = {
            basePackage,
            ...classData,
            capitalize: this.capitalize,
            idType: classData.idType || 'Long',
        };
        await this.renderTemplate(path.join(templatesDir, 'Entity.java.ejs'), path.join(projectPath, `src/main/java/${basePath}/entity/${classData.className}.java`), templateData);
        await this.renderTemplate(path.join(templatesDir, 'DTO.java.ejs'), path.join(projectPath, `src/main/java/${basePath}/dto/${classData.className}DTO.java`), templateData);
        await this.renderTemplate(path.join(templatesDir, 'Repository.java.ejs'), path.join(projectPath, `src/main/java/${basePath}/repository/${classData.className}Repository.java`), templateData);
        await this.renderTemplate(path.join(templatesDir, 'Service.java.ejs'), path.join(projectPath, `src/main/java/${basePath}/service/${classData.className}Service.java`), templateData);
        await this.renderTemplate(path.join(templatesDir, 'Controller.java.ejs'), path.join(projectPath, `src/main/java/${basePath}/controller/${classData.className}Controller.java`), templateData);
        await this.renderTemplate(path.join(templatesDir, 'ControllerTest.java.ejs'), path.join(projectPath, `src/test/java/${basePath}/controller/${classData.className}ControllerTest.java`), templateData);
    }
    async renderTemplate(templatePath, outputPath, data) {
        const template = await fs.readFile(templatePath, 'utf-8');
        const rendered = ejs.render(template, data);
        await fs.writeFile(outputPath, rendered);
    }
    async createZipFile(projectPath, zipPath) {
        return new Promise((resolve, reject) => {
            const output = (0, fs_1.createWriteStream)(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', () => {
                console.log(`ZIP file created: ${archive.pointer()} total bytes`);
                resolve();
            });
            archive.on('error', (err) => {
                reject(err);
            });
            archive.pipe(output);
            archive.directory(projectPath, false);
            archive.finalize();
        });
    }
    async downloadProject(generatedCodeId) {
        const generatedCode = await this.prisma.generatedCode.findUnique({
            where: { id: generatedCodeId },
        });
        if (!generatedCode) {
            throw new Error('Generated code not found');
        }
        return generatedCode.zipPath;
    }
    async getGeneratedProjects(userId) {
        return this.prisma.generatedCode.findMany({
            where: { generatedBy: userId },
            include: {
                diagram: {
                    select: {
                        name: true,
                        id: true,
                    },
                },
            },
            orderBy: { generatedAt: 'desc' },
        });
    }
};
exports.CodeGenerationService = CodeGenerationService;
exports.CodeGenerationService = CodeGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CodeGenerationService);
//# sourceMappingURL=code-generation.service.js.map