import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as budgetsService from "./budgets.service";

export const budgetsRouter = Router();

const budgetSchema = z.object({
  categoryId: z.number().int(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM"),
  limitAmount: z.number().positive(),
});

budgetsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    res.json(budgetsService.listBudgets(month));
  }),
);

budgetsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = budgetSchema.parse(req.body);
    res.status(201).json(budgetsService.createBudget(input));
  }),
);

budgetsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = budgetSchema.partial().parse(req.body);
    res.json(budgetsService.updateBudget(Number(req.params.id), input));
  }),
);

budgetsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    budgetsService.deleteBudget(Number(req.params.id));
    res.status(204).send();
  }),
);
