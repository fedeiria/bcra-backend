import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Validate the user's credentials. If valid, returns the user object without the password hash. Otherwise, throws an UnauthorizedException.
     * @param email The email of the user trying to authenticate
     * @param passwordPlain The plain text password provided by the user for authentication
     * @returns A user object without the password hash if authentication is successful, or throws an exception if it fails
     */
    async validateUser(email: string, passwordPlain: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (user) {
            const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
            if (isPasswordValid) {
                // Excludes the passwordHash from the returned user object for security reasons
                const { passwordHash, ...result } = user;
                return result;
            }
        }

        throw new UnauthorizedException('Credenciales inválidas');
    }

    /**
     * Generates a JWT token for the authenticated user and returns it along with some user information. The token payload includes the user's ID, email, name and role.
     * @param user The authenticated user object for which to generate the JWT token. It should contain at least the user's ID, email, name and role.
     * @returns A promise resolving to the login response containing the access token and user information.
     */
    async login(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        return {
            error: false,
            data: {
                accessToken: this.jwtService.sign(payload),
                user: {
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            },
            message: 'Login exitoso'
        };
    }
}