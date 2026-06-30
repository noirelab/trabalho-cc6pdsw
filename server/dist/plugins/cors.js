"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCors = registerCors;
const cors_1 = __importDefault(require("@fastify/cors"));
async function registerCors(app) {
    await app.register(cors_1.default, {
        origin: "http://localhost:3000",
        credentials: true,
    });
}
//# sourceMappingURL=cors.js.map