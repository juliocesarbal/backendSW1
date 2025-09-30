import { Injectable, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectType } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';
import * as ejs from 'ejs';

@Injectable()
export class CodeGenerationService {
  constructor(private prisma: PrismaService) {}

  async generateSpringBootProject(diagramId: string, userId: string) {
    console.log(`🚀 Generating Spring Boot project for diagram: ${diagramId}`);

    // Get diagram data from JSON field (NOT from relational tables)
    const diagram = await this.prisma.retryQuery(() =>
      this.prisma.diagram.findUnique({
        where: { id: diagramId },
      })
    );

    if (!diagram) {
      throw new BadRequestException('Diagram not found');
    }

    // Extract classes and relations from the JSON data field
    const diagramData = diagram.data as any;
    const classes = diagramData.classes || [];
    const relations = diagramData.relations || [];

    console.log(`📊 Diagram found: ${diagram.name}`);
    console.log(`📦 Classes count: ${classes.length}`);
    console.log(`🔗 Relations count: ${relations.length}`);

    // Validate and normalize diagram before generation
    this.validateAndNormalizeDiagram(classes);

    // Prepare project metadata
    const projectName = diagram.name.toLowerCase().replace(/\s+/g, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectPath = `./generated-projects/${projectName}-${timestamp}`;
    const basePackage = `com.example.${projectName.replace(/-/g, '')}`;
    const dbName = projectName.replace(/-/g, '_');

    console.log(`📁 Project path: ${projectPath}`);
    console.log(`📦 Base package: ${basePackage}`);

    try {
      // Create project structure
      await this.createProjectStructure(projectPath, projectName);
      console.log('✅ Project structure created');

      // Transform diagram data to template-friendly format
      const transformedClasses = this.transformClasses(classes, relations);
      console.log(`✅ Transformed ${transformedClasses.length} classes`);

      // Generate files using EJS templates
      await this.generateFromTemplates(projectPath, {
        projectName,
        basePackage,
        dbName,
        classes: transformedClasses,
      });
      console.log('✅ Files generated from templates');

      // Create ZIP file
      const zipPath = `${projectPath}.zip`;
      await this.createZipFile(projectPath, zipPath);
      console.log(`✅ ZIP file created: ${zipPath}`);

      // Save generation record (with retry logic)
      const generatedCode = await this.prisma.retryQuery(() =>
        this.prisma.generatedCode.create({
          data: {
            projectType: ProjectType.SPRING_BOOT,
            zipPath: zipPath,
            diagramId,
            generatedBy: userId,
          },
        })
      );

      return {
        success: true,
        projectPath,
        zipPath,
        generatedCodeId: generatedCode.id,
        message: 'Spring Boot project generated successfully with tests and Docker configuration',
      };
    } catch (error) {
      console.error('❌ Error generating project:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Failed to generate Spring Boot project: ${error.message}`);
    }
  }

  private validateAndNormalizeDiagram(classes: any[]) {
    if (!classes || classes.length === 0) {
      throw new BadRequestException('Diagram must contain at least one class');
    }

    console.log('🔍 Validating and normalizing diagram...');

    // Check each class and add ID if missing
    for (const umlClass of classes) {
      // Initialize attributes array if it doesn't exist
      if (!umlClass.attributes) {
        umlClass.attributes = [];
      }

      console.log(`  Checking class: ${umlClass.name}, attributes: ${umlClass.attributes.length}`);

      const hasId = umlClass.attributes.some((attr: any) => attr.stereotype === 'id');

      if (!hasId) {
        console.log(`  ⚠️  No ID found for ${umlClass.name}, adding default 'id' attribute`);

        // Auto-add ID attribute if missing
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

  private transformClasses(umlClasses: any[], relations: any[]) {
    return umlClasses.map((umlClass) => {
      const className = umlClass.name;
      const varName = className.charAt(0).toLowerCase() + className.slice(1);
      const pluralName = this.pluralize(className.toLowerCase());
      const tableName = className.toLowerCase();

      // Get ID attribute
      const idAttribute = umlClass.attributes.find((attr: any) => attr.stereotype === 'id');
      const idType = idAttribute ? this.mapToJavaType(idAttribute.type) : 'Long';

      // Transform attributes
      const attributes = this.transformAttributes(umlClass.attributes, umlClass.id, className, relations, umlClasses);

      // Get unique fields for Repository
      const uniqueFields = attributes
        .filter((attr) => attr.unique && !attr.isId)
        .map((attr) => ({
          name: attr.name,
          type: attr.type,
        }));

      // Generate sample data for README
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

  private transformAttributes(attributes: any[], classId: string, className: string, relations: any[], allClasses: any[]) {
    const result = [];

    // First, add scalar attributes
    for (const attr of attributes) {
      const isId = attr.stereotype === 'id';
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

    // Then, add relations
    const classRelations = relations.filter(
      (r) => r.sourceClassId === classId || r.targetClassId === classId
    );

    for (const relation of classRelations) {
      const isSource = relation.sourceClassId === classId;
      const targetClassId = isSource ? relation.targetClassId : relation.sourceClassId;

      // Find the actual target class name
      const targetClass = allClasses.find(c => c.id === targetClassId);
      if (!targetClass) {
        console.warn(`⚠️  Target class not found for relation: ${relation.id}`);
        continue;
      }

      const targetClassName = targetClass.name;
      const relationType = this.mapRelationType(relation.type, isSource);
      const relationName = relation.name || targetClassName.toLowerCase();

      if (relationType === 'MANY_TO_ONE') {
        result.push({
          name: relationName,
          type: targetClassName,
          columnName: `${relationName}_id`,
          nullable: true,
          unique: false,
          isId: false,
          isRelation: true,
          relationType: 'MANY_TO_ONE',
        });
      } else if (relationType === 'ONE_TO_MANY') {
        result.push({
          name: relationName || `${targetClassName.toLowerCase()}s`,
          type: `List<${targetClassName}>`,
          nullable: true,
          unique: false,
          isId: false,
          isRelation: true,
          relationType: 'ONE_TO_MANY',
          mappedBy: className.toLowerCase(),
        });
      } else if (relationType === 'MANY_TO_MANY') {
        result.push({
          name: relationName || `${targetClassName.toLowerCase()}s`,
          type: `Set<${targetClassName}>`,
          nullable: true,
          unique: false,
          isId: false,
          isRelation: true,
          relationType: 'MANY_TO_MANY',
          joinTable: `${className.toLowerCase()}_${targetClassName.toLowerCase()}`,
          joinColumn: `${className.toLowerCase()}_id`,
          inverseJoinColumn: `${targetClassName.toLowerCase()}_id`,
        });
      } else if (relationType === 'ONE_TO_ONE') {
        result.push({
          name: relationName,
          type: targetClassName,
          columnName: `${relationName}_id`,
          nullable: true,
          unique: false,
          isId: false,
          isRelation: true,
          relationType: 'ONE_TO_ONE',
        });
      }
    }

    return result;
  }

  private mapRelationType(relationType: string, isSource: boolean): string {
    // Normalize the relation type (handle different formats)
    const normalizedType = relationType.toUpperCase().replace(/-/g, '_');

    // Map relation types to JPA annotations
    switch (normalizedType) {
      case 'MANYTOMANY':
      case 'MANY_TO_MANY':
        return 'MANY_TO_MANY';

      case 'ONETOMANY':
      case 'ONE_TO_MANY':
        // If this class is the source of OneToMany, it has the collection
        return isSource ? 'ONE_TO_MANY' : 'MANY_TO_ONE';

      case 'MANYTOONE':
      case 'MANY_TO_ONE':
        // If this class is the source of ManyToOne, it has the single reference
        return isSource ? 'MANY_TO_ONE' : 'ONE_TO_MANY';

      case 'ONETOONE':
      case 'ONE_TO_ONE':
        return 'ONE_TO_ONE';

      case 'ASSOCIATION':
        // Generic association defaults to ManyToOne from source side
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

  private mapToJavaType(umlType: string): string {
    const typeMap: { [key: string]: string } = {
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

  private getSampleValue(javaType: string): string {
    const sampleMap: { [key: string]: string } = {
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

  private pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    } else if (word.endsWith('s')) {
      return word + 'es';
    } else {
      return word + 's';
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async createProjectStructure(projectPath: string, projectName: string) {
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

  private async generateFromTemplates(projectPath: string, data: any) {
    const templatesDir = path.join(__dirname, '../../templates/springboot');
    const { projectName, basePackage, dbName, classes } = data;
    const className = this.capitalize(projectName.replace(/-/g, ''));

    // Generate pom.xml
    await this.renderTemplate(
      path.join(templatesDir, 'pom.xml.ejs'),
      path.join(projectPath, 'pom.xml'),
      { projectName }
    );

    // Generate Application.java
    const appPath = `src/main/java/${basePackage.replace(/\./g, '/')}/`;
    await this.renderTemplate(
      path.join(templatesDir, 'Application.java.ejs'),
      path.join(projectPath, appPath, `${className}Application.java`),
      { basePackage, className }
    );

    // Generate application.properties
    await this.renderTemplate(
      path.join(templatesDir, 'application.properties.ejs'),
      path.join(projectPath, 'src/main/resources/application.properties'),
      { projectName, dbName }
    );

    // Generate docker-compose.yml
    await this.renderTemplate(
      path.join(templatesDir, 'docker-compose.yml.ejs'),
      path.join(projectPath, 'docker-compose.yml'),
      { projectName, dbName }
    );

    // Generate README.md
    await this.renderTemplate(
      path.join(templatesDir, 'README.md.ejs'),
      path.join(projectPath, 'README.md'),
      { projectName, basePackage, dbName, classes }
    );

    // Generate exception handlers
    const exceptionPath = `src/main/java/${basePackage.replace(/\./g, '/')}/exception/`;
    await this.renderTemplate(
      path.join(templatesDir, 'GlobalExceptionHandler.java.ejs'),
      path.join(projectPath, exceptionPath, 'GlobalExceptionHandler.java'),
      { basePackage }
    );
    await this.renderTemplate(
      path.join(templatesDir, 'ResourceNotFoundException.java.ejs'),
      path.join(projectPath, exceptionPath, 'ResourceNotFoundException.java'),
      { basePackage }
    );

    // Generate for each class
    for (const cls of classes) {
      await this.generateClassFiles(projectPath, basePackage, cls);
    }
  }

  private async generateClassFiles(projectPath: string, basePackage: string, classData: any) {
    const templatesDir = path.join(__dirname, '../../templates/springboot');
    const basePath = basePackage.replace(/\./g, '/');

    const templateData = {
      basePackage,
      ...classData,
      capitalize: this.capitalize,
      idType: classData.idType || 'Long',
    };

    // Generate Entity
    await this.renderTemplate(
      path.join(templatesDir, 'Entity.java.ejs'),
      path.join(projectPath, `src/main/java/${basePath}/entity/${classData.className}.java`),
      templateData
    );

    // Generate DTO
    await this.renderTemplate(
      path.join(templatesDir, 'DTO.java.ejs'),
      path.join(projectPath, `src/main/java/${basePath}/dto/${classData.className}DTO.java`),
      templateData
    );

    // Generate Repository
    await this.renderTemplate(
      path.join(templatesDir, 'Repository.java.ejs'),
      path.join(projectPath, `src/main/java/${basePath}/repository/${classData.className}Repository.java`),
      templateData
    );

    // Generate Service
    await this.renderTemplate(
      path.join(templatesDir, 'Service.java.ejs'),
      path.join(projectPath, `src/main/java/${basePath}/service/${classData.className}Service.java`),
      templateData
    );

    // Generate Controller
    await this.renderTemplate(
      path.join(templatesDir, 'Controller.java.ejs'),
      path.join(projectPath, `src/main/java/${basePath}/controller/${classData.className}Controller.java`),
      templateData
    );

    // Generate Test
    await this.renderTemplate(
      path.join(templatesDir, 'ControllerTest.java.ejs'),
      path.join(projectPath, `src/test/java/${basePath}/controller/${classData.className}ControllerTest.java`),
      templateData
    );
  }

  private async renderTemplate(templatePath: string, outputPath: string, data: any) {
    const template = await fs.readFile(templatePath, 'utf-8');
    const rendered = ejs.render(template, data);
    await fs.writeFile(outputPath, rendered);
  }

  private async createZipFile(projectPath: string, zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
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

  async downloadProject(generatedCodeId: string): Promise<string> {
    const generatedCode = await this.prisma.generatedCode.findUnique({
      where: { id: generatedCodeId },
    });

    if (!generatedCode) {
      throw new Error('Generated code not found');
    }

    return generatedCode.zipPath;
  }

  async getGeneratedProjects(userId: string) {
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
}
