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
exports.projectsRoutes = projectsRoutes;
const projects_schema_1 = require("./projects.schema");
const projectsService = __importStar(require("./projects.service"));
const auth_1 = require("../../plugins/auth");
async function projectsRoutes(app) {
    app.get("/api/projects", async (request, reply) => {
        const result = await projectsService.listProjectsPaginated(request.query);
        return reply.send(result);
    });
    app.post("/api/projects", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const parsed = projects_schema_1.createProjectSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const project = await projectsService.createProject(parsed.data);
        return reply.status(201).send({ project });
    });
    app.put("/api/projects/:id", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const parsed = projects_schema_1.updateProjectSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const project = await projectsService.updateProject(Number(id), parsed.data);
        return reply.send({ project });
    });
    app.delete("/api/projects/:id", { preHandler: [auth_1.authMiddleware, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        await projectsService.deleteProject(Number(id));
        return reply.status(204).send();
    });
}
//# sourceMappingURL=projects.routes.js.map