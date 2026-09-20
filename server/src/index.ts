import dotenv from "dotenv";
import path from "node:path";
import { createApp } from "./app";
import { migrate } from "./db/migrate";
import { seedIfEmpty } from "./db/seed";
import { startCurrencyScheduler } from "./modules/currency/currency.scheduler";
import { startRecurringScheduler } from "./modules/recurring/recurring.scheduler";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

migrate();
seedIfEmpty();
startRecurringScheduler();
startCurrencyScheduler();

const app = createApp();
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
