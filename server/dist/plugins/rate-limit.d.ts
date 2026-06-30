import { FastifyRequest, FastifyReply } from "fastify";
export declare function loginRateLimit(request: FastifyRequest, _reply: FastifyReply): Promise<void>;
export declare function clearRateLimit(ip: string): void;
//# sourceMappingURL=rate-limit.d.ts.map