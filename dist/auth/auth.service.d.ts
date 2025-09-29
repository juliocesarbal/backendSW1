import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string;
            createdAt: Date;
        };
        token: string;
    }>;
    validateUser(email: string, password: string): Promise<{
        email: string;
        name: string;
        id: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(userId: string): Promise<{
        email: string;
        name: string;
        id: string;
        avatar: string;
        createdAt: Date;
    }>;
}
