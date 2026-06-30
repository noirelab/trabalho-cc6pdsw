"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = usersRoutes;
const users_schema_1 = require("./users.schema");
const usersService = __importStar(require("./users.service"));
const auth_1 = require("../../plugins/auth");
const errors_1 = require("../../lib/errors");
async function usersRoutes(app) {
    app.get("/api/users", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const result = await usersService.listUsersPaginated(request.query);
        return reply.send(result);
    });
    app.post("/api/users", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const parsed = users_schema_1.createUserSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const user = await usersService.createUser(parsed.data);
        return reply.status(201).send({ user });
    });
    app.put("/api/users/:id", { preHandler: auth_1.authMiddleware }, async (request, reply) => {
        const { id } = request.params;
        const parsed = users_schema_1.updateUserSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const userId = Number(id);
        if (request.user.userId !== userId && request.user.role !== "admin") {
            throw new errors_1.ForbiddenError("Você só pode editar seu próprio perfil");
        }
        const user = await usersService.updateUser(userId, parsed.data);
        return reply.send({ user });
    });
    app.delete("/api/users/:id", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        await usersService.deleteUser(Number(id));
        return reply.status(204).send();
    });
}
//# sourceMappingURL=users.routes.js.map