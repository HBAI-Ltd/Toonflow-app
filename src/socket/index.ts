import { Server } from "socket.io";
import productionAgent from "./routes/productionAgent";
import scriptAgent from "./routes/scriptAgent";

export default (io: Server) => {
  const routes: Record<string, (nsp: ReturnType<Server["of"]>) => void> = {
    productionAgent,
    scriptAgent,
  };

  for (const [name, handler] of Object.entries(routes)) {
    const nsp = io.of(`/api/socket/${name}`);
    handler(nsp);
    console.log(`[Socket] Registered namespace: /api/socket/${name}`);
  }
};
