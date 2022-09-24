export class ContextModel  {
    user: {
        _id: string;
        name: string;
        email: string;
        role: number;
        department?: string | null;
        ID?: string | null;
    }
}