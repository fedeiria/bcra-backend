export class CreateUserDto {
    email: string = '';
    passwordHash: string = '';
    username: string = '';
    role?: string;
}