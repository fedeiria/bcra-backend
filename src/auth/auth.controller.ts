import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Endpoint to authenticate a user and generate a JWT token if the credentials are valid. It expects an email and a plain text password in the request body. If the credentials are valid, it returns a response containing the access token and some user information. If the credentials are invalid or if any required field is missing, it throws an appropriate exception.
     * POST /auth/login
     * @param body The request body containing the user's email and password
     * @returns A promise resolving to the login response containing the access token and user information
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: { email: string; passwordPlain: string }) {
        if (!body.email || !body.passwordPlain) {
            throw new BadRequestException('Correo y contraseña son requeridos.');
        }

        // Validates the user's credentials and retrieves the user object if valid. If the credentials are invalid, an exception will be thrown.
        const user = await this.authService.validateUser(body.email, body.passwordPlain);

        // Generates a JWT token for the authenticated user and returns it along with some user information. The token payload includes the user's ID, email, name and role.
        return this.authService.login(user);
    }

    /**
     * Backup endpoint to register a new user. This is not intended for production use and should be removed or protected in a real application. It expects an email, a plain text password and a name in the request body. If the registration is successful, it returns a response containing the new user's ID and email. If any required field is missing or if the email is already registered, it throws an appropriate exception.
     * POST /auth/register
     * @param body The request body containing the user's email, password and name
     * @returns A promise resolving to the registration response containing the new user's ID and email
     */
    @Post('register')
    async register(@Body() body: { email: string; passwordPlain: string; username: string }) {
        if (!body.email || !body.passwordPlain || !body.username) {
            throw new BadRequestException('Todos los campos son obligatorios.');
        }

        const newUser = await this.usersService.create(body.email, body.passwordPlain, body.username);

        return {
            error: false,
            message: 'Usuario registrado con éxito.',
            data: { id: newUser.id, email: newUser.email }
        };
    }
}