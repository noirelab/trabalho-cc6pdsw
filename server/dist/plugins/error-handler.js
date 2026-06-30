"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = registerErrorHandler;
const errors_1 = require("../lib/errors");
function registerErrorHandler(app) {
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof errors_1.AppError) {
            const body = {
                error: error.name,
                message: error.message,
                statusCode: error.statusCode,
            };
            if ("details" in error && error.details !== undefined) {
                body.details = error.details;
            }
            return reply.status(error.statusCode).send(body);
        }
        if (error instanceof Error) {
            app.log.error(error);
        }
        return reply.status(500).send({
            error: "InternalError",
            message: "Erro interno do servidor",
            statusCode: 500,
        });
    });
}
//# sourceMappingURL=error-handler.js.map