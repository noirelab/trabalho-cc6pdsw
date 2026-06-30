export declare function login(username: string, password: string): Promise<{
    token: string;
    user: {
        id: number;
        username: string;
        name: string;
    };
}>;
export declare function getUser(userId: number): Promise<{
    username: string;
    id: number;
    name: string;
    createdAt: Date;
}>;
//# sourceMappingURL=auth.service.d.ts.map