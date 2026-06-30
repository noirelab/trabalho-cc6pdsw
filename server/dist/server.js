"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const PORT = Number(process.env.PORT) || 3001;
async function main() {
    const app = (0, app_1.buildApp)();
    try {
        await app.listen({ port: PORT });
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map