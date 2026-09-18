import dotenv from "dotenv";
import path from "node:path";
import { createApp } from "./app";
import { migrate } from "./db/migrate";
import { seedIfEmpty } from "./db/seed";
import { startRecurringScheduler } from "./modules/recurring/recurring.scheduler";

// Repo-root .env (works the same whether this runs from src/ via tsx or
// dist/ after a build, and regardless of the process's cwd).
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

migrate();
seedIfEmpty();
startRecurringScheduler();

const app = createApp();
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
