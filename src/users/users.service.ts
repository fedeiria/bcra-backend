import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    /**
     * Create a new user with the provided email, plain password and name. The password will be hashed before saving.
     * @param email The email of the user to create
     * @param passwordPlain The plain text password that will be hashed and stored
     * @param username The username of the user to create
     * @returns The created user
     */
    async create(email: string, passwordPlain: string, username: string): Promise<User> {
        // Verify if a user with the same email already exists to prevent duplicates
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya se encuentra registrado.');
        }

        // Generates the salt and hashes the password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordPlain, salt);

        // Create a new user entity and save it to the database
        const newUser = this.userRepository.create({
            email,
            passwordHash,
            username: username,
        });

        return this.userRepository.save(newUser);
    }

    /**
     * Find a user by their email address.
     * @param email The email of the user to find
     * @returns A user entity if found, or null if no user with that email exists
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }
}