import cors from "cors";
import express, { type Express } from "express";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { accountsRouter } from "./modules/accounts/accounts.routes";
import { budgetsRouter } from "./modules/budgets/budgets.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { creditRouter } from "./modules/credit/credit.routes";
import { currencyRouter } from "./modules/currency/currency.routes";
import { debtsRouter } from "./modules/debts/debts.routes";
import { goalsRouter } from "./modules/goals/goals.routes";
import { insightsRouter } from "./modules/insights/insights.routes";
import { recurringRouter } from "./modules/recurring/recurring.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { transactionsRouter } from "./modules/transactions/transactions.routes";
import { errorHandler } from "./shared/errors";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/accounts", accountsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/recurring", recurringRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/goals", goalsRouter);
  app.use("/api/credit", creditRouter);
  app.use("/api/insights", insightsRouter);
  app.use("/api/currency", currencyRouter);
  app.use("/api/debts", debtsRouter);

  const clientDist = path.join(__dirname, "../../client/dist");
  if (fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
