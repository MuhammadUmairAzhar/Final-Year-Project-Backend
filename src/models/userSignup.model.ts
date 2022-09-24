export class UserSignupModel {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    department?: string | null;
    ID?: string | null;
}