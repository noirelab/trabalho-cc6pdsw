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
exports.servicesRoutes = servicesRoutes;
const services_schema_1 = require("./services.schema");
const servicesService = __importStar(require("./services.service"));
const auth_1 = require("../../plugins/auth");
async function servicesRoutes(app) {
    app.get("/api/services", async (request, reply) => {
        const result = await servicesService.listServicesPaginated(request.query);
        return reply.send(result);
    });
    app.get("/api/services/:id", async (request, reply) => {
        const { id } = request.params;
        const service = await servicesService.getServiceById(Number(id));
        return reply.send({ service });
    });
    app.post("/api/services", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const parsed = services_schema_1.createServiceSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const service = await servicesService.createService(parsed.data);
        return reply.status(201).send({ service });
    });
    app.put("/api/services/:id", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const parsed = services_schema_1.updateServiceSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const service = await servicesService.updateService(Number(id), parsed.data);
        return reply.send({ service });
    });
    app.delete("/api/services/:id", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        await servicesService.deleteService(Number(id));
        return reply.status(204).send();
    });
}
//# sourceMappingURL=services.routes.js.map