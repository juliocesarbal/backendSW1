import { Response } from 'express';
import { CodeGenerationService } from './code-generation.service';
export declare class CodeGenerationController {
    private codeGenerationService;
    constructor(codeGenerationService: CodeGenerationService);
    generateSpringBoot(diagramId: string, req: any, res: Response): Promise<void>;
    downloadProject(generatedCodeId: string, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    generateFlutter(diagramId: string, req: any, res: Response): Promise<void>;
    getGeneratedProjects(req: any, res: Response): Promise<void>;
}
