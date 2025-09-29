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
let CodeGenerationService = class CodeGenerationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateSpringBootProject(diagramId, userId) {
        const diagram = await this.prisma.diagram.findUnique({
            where: { id: diagramId },
            include: {
                classes: {
                    include: {
                        attributes: true,
                        methods: true,
                    },
                },
                relations: true,
            },
        });
        if (!diagram) {
            throw new Error('Diagram not found');
        }
        const projectName = diagram.name.toLowerCase().replace(/\s+/g, '-');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const projectPath = `./generated-projects/${projectName}-${timestamp}`;
        try {
            await this.createProjectStructure(projectPath, projectName);
            await this.generateMainApplication(projectPath, projectName);
            await this.generateEntities(projectPath, diagram.classes);
            await this.generateRepositories(projectPath, diagram.classes);
            await this.generateServices(projectPath, diagram.classes);
            await this.generateControllers(projectPath, diagram.classes);
            await this.generateApplicationProperties(projectPath);
            await this.generatePomXml(projectPath, projectName);
            const zipPath = `${projectPath}.zip`;
            await this.createZipFile(projectPath, zipPath);
            const generatedCode = await this.prisma.generatedCode.create({
                data: {
                    projectType: client_1.ProjectType.SPRING_BOOT,
                    zipPath: zipPath,
                    diagramId,
                    generatedBy: userId,
                },
            });
            return {
                success: true,
                projectPath,
                zipPath,
                generatedCodeId: generatedCode.id,
                message: 'Spring Boot project generated successfully',
            };
        }
        catch (error) {
            console.error('Error generating project:', error);
            throw new Error('Failed to generate Spring Boot project');
        }
    }
    async createProjectStructure(projectPath, projectName) {
        const packagePath = `src/main/java/com/example/${projectName.replace(/-/g, '')}`;
        const resourcesPath = 'src/main/resources';
        const testPath = `src/test/java/com/example/${projectName.replace(/-/g, '')}`;
        const directories = [
            `${projectPath}/${packagePath}/entity`,
            `${projectPath}/${packagePath}/repository`,
            `${projectPath}/${packagePath}/service`,
            `${projectPath}/${packagePath}/controller`,
            `${projectPath}/${packagePath}/dto`,
            `${projectPath}/${resourcesPath}`,
            `${projectPath}/${testPath}`,
        ];
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async generateEntities(projectPath, classes) {
        for (const umlClass of classes) {
            const entityContent = this.generateEntityClass(umlClass);
            const fileName = `${umlClass.name}.java`;
            const packagePath = `src/main/java/com/example/entity`;
            await fs.writeFile(path.join(projectPath, packagePath, fileName), entityContent);
        }
    }
    generateEntityClass(umlClass) {
        const className = umlClass.name;
        const attributes = umlClass.attributes || [];
        const idAttribute = attributes.find(attr => attr.stereotype === 'id');
        return `package com.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "${className.toLowerCase()}")
public class ${className} {

${attributes.map(attr => this.generateAttribute(attr)).join('\n')}

    // Constructors
    public ${className}() {}

${attributes.map(attr => this.generateGetter(attr)).join('\n')}

${attributes.map(attr => this.generateSetter(attr)).join('\n')}
${idAttribute ? `
    public void setId(${this.mapToJavaType(idAttribute.type)} id) {
        this.${idAttribute.name} = id;
    }` : ''}
}`;
    }
    generateAttribute(attribute) {
        const annotations = [];
        if (attribute.stereotype === 'id') {
            annotations.push('    @Id');
            annotations.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
        }
        let columnAnnotation = `    @Column(name = "${attribute.name.toLowerCase()}"`;
        if (!attribute.nullable) {
            columnAnnotation += ', nullable = false';
        }
        if (attribute.unique) {
            columnAnnotation += ', unique = true';
        }
        columnAnnotation += ')';
        annotations.push(columnAnnotation);
        const javaType = this.mapToJavaType(attribute.type);
        return `${annotations.join('\n')}
    private ${javaType} ${attribute.name};`;
    }
    generateGetter(attribute) {
        const javaType = this.mapToJavaType(attribute.type);
        const methodName = `get${this.capitalize(attribute.name)}`;
        return `    public ${javaType} ${methodName}() {
        return this.${attribute.name};
    }`;
    }
    generateSetter(attribute) {
        const javaType = this.mapToJavaType(attribute.type);
        const methodName = `set${this.capitalize(attribute.name)}`;
        return `    public void ${methodName}(${javaType} ${attribute.name}) {
        this.${attribute.name} = ${attribute.name};
    }`;
    }
    mapToJavaType(umlType) {
        const typeMap = {
            'String': 'String',
            'Integer': 'Integer',
            'Long': 'Long',
            'BigDecimal': 'BigDecimal',
            'Boolean': 'Boolean',
            'LocalDate': 'LocalDate',
            'LocalDateTime': 'LocalDateTime',
        };
        return typeMap[umlType] || 'String';
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    async generateRepositories(projectPath, classes) {
        for (const umlClass of classes) {
            const repositoryContent = `package com.example.repository;

import com.example.entity.${umlClass.name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${umlClass.name}Repository extends JpaRepository<${umlClass.name}, Long> {
}`;
            const fileName = `${umlClass.name}Repository.java`;
            const packagePath = `src/main/java/com/example/repository`;
            await fs.writeFile(path.join(projectPath, packagePath, fileName), repositoryContent);
        }
    }
    async generateServices(projectPath, classes) {
        for (const umlClass of classes) {
            const serviceContent = `package com.example.service;

import com.example.entity.${umlClass.name};
import com.example.repository.${umlClass.name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ${umlClass.name}Service {

    @Autowired
    private ${umlClass.name}Repository ${umlClass.name.toLowerCase()}Repository;

    public List<${umlClass.name}> findAll() {
        return ${umlClass.name.toLowerCase()}Repository.findAll();
    }

    public Optional<${umlClass.name}> findById(Long id) {
        return ${umlClass.name.toLowerCase()}Repository.findById(id);
    }

    public ${umlClass.name} save(${umlClass.name} ${umlClass.name.toLowerCase()}) {
        return ${umlClass.name.toLowerCase()}Repository.save(${umlClass.name.toLowerCase()});
    }

    public void deleteById(Long id) {
        ${umlClass.name.toLowerCase()}Repository.deleteById(id);
    }
}`;
            const fileName = `${umlClass.name}Service.java`;
            const packagePath = `src/main/java/com/example/service`;
            await fs.writeFile(path.join(projectPath, packagePath, fileName), serviceContent);
        }
    }
    async generateControllers(projectPath, classes) {
        for (const umlClass of classes) {
            const controllerContent = `package com.example.controller;

import com.example.entity.${umlClass.name};
import com.example.service.${umlClass.name}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/${umlClass.name.toLowerCase()}s")
@CrossOrigin(origins = "*")
public class ${umlClass.name}Controller {

    @Autowired
    private ${umlClass.name}Service ${umlClass.name.toLowerCase()}Service;

    @GetMapping
    public List<${umlClass.name}> getAll() {
        return ${umlClass.name.toLowerCase()}Service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${umlClass.name}> getById(@PathVariable Long id) {
        Optional<${umlClass.name}> ${umlClass.name.toLowerCase()} = ${umlClass.name.toLowerCase()}Service.findById(id);
        return ${umlClass.name.toLowerCase()}.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${umlClass.name} create(@RequestBody ${umlClass.name} ${umlClass.name.toLowerCase()}) {
        return ${umlClass.name.toLowerCase()}Service.save(${umlClass.name.toLowerCase()});
    }

    @PutMapping("/{id}")
    public ResponseEntity<${umlClass.name}> update(@PathVariable Long id, @RequestBody ${umlClass.name} ${umlClass.name.toLowerCase()}) {
        Optional<${umlClass.name}> existing = ${umlClass.name.toLowerCase()}Service.findById(id);
        if (existing.isPresent()) {
            ${umlClass.name.toLowerCase()}.setId(id);
            return ResponseEntity.ok(${umlClass.name.toLowerCase()}Service.save(${umlClass.name.toLowerCase()}));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ${umlClass.name.toLowerCase()}Service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}`;
            const fileName = `${umlClass.name}Controller.java`;
            const packagePath = `src/main/java/com/example/controller`;
            await fs.writeFile(path.join(projectPath, packagePath, fileName), controllerContent);
        }
    }
    async generateApplicationProperties(projectPath) {
        const content = `# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/generated_project
spring.datasource.username=postgres
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Server Configuration
server.port=8080

# CORS Configuration
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*`;
        await fs.writeFile(path.join(projectPath, 'src/main/resources/application.properties'), content);
    }
    async generatePomXml(projectPath, projectName) {
        const content = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>${projectName}</artifactId>
    <version>1.0.0</version>
    <name>${projectName}</name>
    <description>Generated Spring Boot project from UML diagram</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;
        await fs.writeFile(path.join(projectPath, 'pom.xml'), content);
    }
    async generateMainApplication(projectPath, projectName) {
        const className = this.capitalize(projectName.replace(/-/g, ''));
        const packageName = `com.example.${projectName.replace(/-/g, '')}`;
        const content = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className}Application {

    public static void main(String[] args) {
        SpringApplication.run(${className}Application.class, args);
    }
}`;
        const packagePath = `src/main/java/com/example/${projectName.replace(/-/g, '')}`;
        await fs.writeFile(path.join(projectPath, packagePath, `${className}Application.java`), content);
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