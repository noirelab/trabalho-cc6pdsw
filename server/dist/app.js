"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const cors_1 = require("./plugins/cors");
const error_handler_1 = require("./plugins/error-handler");
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const services_routes_1 = require("./modules/services/services.routes");
const contacts_routes_1 = require("./modules/contacts/contacts.routes");
const projects_routes_1 = require("./modules/projects/projects.routes");
const testimonials_routes_1 = require("./modules/testimonials/testimonials.routes");
function buildApp() {
    const app = (0, fastify_1.default)({ logger: true });
    app.register(cookie_1.default);
    (0, error_handler_1.registerErrorHandler)(app);
    app.register(async (instance) => {
        await (0, cors_1.registerCors)(instance);
        await (0, auth_routes_1.authRoutes)(instance);
        await (0, users_routes_1.usersRoutes)(instance);
        await (0, services_routes_1.servicesRoutes)(instance);
        await (0, contacts_routes_1.contactsRoutes)(instance);
        await (0, projects_routes_1.projectsRoutes)(instance);
        await (0, testimonials_routes_1.testimonialsRoutes)(instance);
    });
    app.get("/api/health", async () => {
        return { status: "ok" };
    });
    return app;
}
//# sourceMappingURL=app.js.map