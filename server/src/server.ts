import "dotenv/config";
import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const app = buildApp();

  try {
    await app.listen({ port: PORT });
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
