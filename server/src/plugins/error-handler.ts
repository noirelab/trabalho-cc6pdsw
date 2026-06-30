import { FastifyInstance } from "fastify";
import { AppError } from "../lib/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      const body: Record<string, unknown> = {
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
