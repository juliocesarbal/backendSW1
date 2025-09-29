import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            email: string;
            name: string;
            id: string;
            avatar: string;
            createdAt: Date;
        };
        token: string;
    }>;
    login(loginDto: LoginDto, req: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string;
            createdAt: Date;
        };
        token: string;
    }>;
    getProfile(req: any): Promise<{
        email: string;
        name: string;
        id: string;
        avatar: string;
        createdAt: Date;
    }>;
    verifyToken(req: any): Promise<{
        valid: boolean;
        user: any;
    }>;
}
