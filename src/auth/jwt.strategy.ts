import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Extract the JWT token from the Authorization header as a Bearer token
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // Verify that the token is not expired.
            ignoreExpiration: false,
            // The secret key used to verify the token's signature. In production, this should be set in an environment variable and not hardcoded.
            secretOrKey: process.env.JWT_SECRET ?? 'CLAVE_SECRETA_SUPER_COMPLICADA_WURTH_2026',
        });
    }

    /**
     * If the token is valid, this method will be called with the decoded payload. It should return an object representing the authenticated user,
     * which will be attached to the request object. In this case, we simply return an object containing the user's ID, email, username and role extracted from the token payload.
     * If the token is invalid or expired, an appropriate exception will be thrown by the framework before this method is called.   
     * @param payload The decoded JWT payload containing the user's information. It should include at least the user's ID (sub), email, username and role.
     * @returns An object representing the authenticated user.
     */
    async validate(payload: { sub: string; email: string; username: string; role: string }) {
        return {
            id: payload.sub,
            email: payload.email,
            username: payload.username,
            role: payload.role
        };
    }
}