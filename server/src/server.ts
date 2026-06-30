import "dotenv/config";
import { buildApp } from "./app";
import { expireOverdue } from "./modules/proposals/proposal.service";

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

  setInterval(async () => {
    try {
      const count = await expireOverdue();
      if (count > 0) {
        console.log(`[expiry] ${count} propostas expiradas automaticamente`);
      }
    } catch (err) {
      app.log.error(err, "Erro ao expirar propostas");
    }
  }, 60_000);
}

main();
