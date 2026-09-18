import { Router } from "express";
import { format, subMonths } from "date-fns";
import { asyncHandler } from "../../shared/errors";
import { BadRequestError } from "../../shared/errors";
import * as reportsService from "./reports.service";

export const reportsRouter = Router();

reportsRouter.get(
  "/spending-by-category",
  asyncHandler(async (req, res) => {
    const month =
      typeof req.query.month === "string" ? req.query.month : format(new Date(), "yyyy-MM");
    res.json(reportsService.spendingByCategory(month));
  }),
);

reportsRouter.get(
  "/income-vs-expense",
  asyncHandler(async (req, res) => {
    const to = typeof req.query.to === "string" ? req.query.to : format(new Date(), "yyyy-MM-dd");
    const from =
      typeof req.query.from === "string"
        ? req.query.from
        : format(subMonths(new Date(), 6), "yyyy-MM-dd");
    if (from > to) throw new BadRequestError("from must be before to");
    res.json(reportsService.incomeVsExpense(from, to));
  }),
);

reportsRouter.get(
  "/balances-overview",
  asyncHandler(async (_req, res) => {
    res.json(reportsService.balancesOverview());
  }),
);
