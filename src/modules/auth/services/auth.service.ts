import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/services/users.service';
import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class AuthService {

    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService,) { }

    /**
     * Validate the user's credentials. If valid, returns the user object without the password hash. Otherwise, throws an UnauthorizedException.
     * @param email The email of the user trying to authenticate
     * @param passwordPlain The plain text password provided by the user for authentication
     * @returns A user object without the password hash if authentication is successful, or throws an exception if it fails
     */
    /* async validateUser(email: string, passwordPlain: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (user) {
            console.log('Usuario encontrado en DB:', user.email);
            const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
            console.log('¿Password válida?:', isPasswordValid);

            if (isPasswordValid) {
                // Excludes the passwordHash from the returned user object for security reasons
                const { password, ...result } = user;
                return result;
            }
            else {
                console.log('Usuario NO encontrado en DB');
            }
        }

        throw new UnauthorizedException('Credenciales inválidas');
    } */
    // auth.service.ts
    async validateUser(email: string, passwordPlain: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Error: Usuario no encontrado en DB');
        }

        if (!user.password) {
            // SI ESTO EXPLOTA ACÁ, EL PROBLEMA ES TYPEORM/SELECT
            throw new UnauthorizedException('Error: El password no se recuperó de la DB');
        }

        const isPasswordValid = await bcrypt.compare(passwordPlain.trim(), user.password);

        if (isPasswordValid) {
            const { password, ...result } = user;
            return result;
        }

        throw new UnauthorizedException(`Error: Password no matchea. Recibida: ${passwordPlain.length} caracteres`);
    }

    /**
     * Generates a JWT token for the authenticated user and returns it along with some user information. The token payload includes the user's ID, email, name and role.
     * @param user The authenticated user object for which to generate the JWT token. It should contain at least the user's ID, email, name and role.
     * @returns A promise resolving to the login response containing the access token and user information.
     */
    async login(user: any): Promise<any> {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        // Generates Access Token
        const accessToken = this.jwtService.sign(payload, {
            secret: APP_CONFIG.jwt.secret,
            expiresIn: APP_CONFIG.jwt.expiresIn,
        });

        // Generates Refresh Token
        const refreshToken = this.jwtService.sign({ sub: user.id }, {
            secret: APP_CONFIG.jwt.refreshSecret,
            expiresIn: APP_CONFIG.jwt.refreshExpiresIn,
        });

        return {
            error: false,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            },
            message: 'Login exitoso.'
        };
    }

    /**
     * Validates a Refresh Token and returns a new Access Token if it is correct.
     */
    async refresh(oldRefreshToken: string): Promise<any> {
        try {
            // Verifies the signature and expirationn Refresh Token
            const payload = this.jwtService.verify(oldRefreshToken, {
                secret: APP_CONFIG.jwt.refreshSecret
            });

            // Search the database for the user to ensure they are active
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('Usuario no encontrado o dado de baja.');
            }

            // Emits a new Access Token
            const newPayload = {
                sub: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            const newAccessToken = this.jwtService.sign(newPayload, {
                secret: APP_CONFIG.jwt.secret,
                expiresIn: APP_CONFIG.jwt.expiresIn
            });

            return {
                error: false,
                data: {
                    accessToken: newAccessToken
                }
            };
        }
        catch (error) {
            throw new UnauthorizedException('Sesión expirada o inválida. Inicie sesión nuevamente.');
        }
    }
}