import { FastifyRequest, FastifyReply } from "fastify";
export interface JwtPayload {
    userId: number;
    username: string;
    role: string;
}
export declare function authMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void>;
export declare function requireAdmin(request: FastifyRequest, _reply: FastifyReply): Promise<void>;
export declare function signToken(payload: JwtPayload): string;
//# sourceMappingURL=auth.d.ts.map