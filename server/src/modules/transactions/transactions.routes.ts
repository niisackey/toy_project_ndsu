import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as transactionsService from "./transactions.service";

export const transactionsRouter = Router();

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive(),
  date: z.string().min(1),
  description: z.string().nullable().optional(),
  accountId: z.number().int(),
  transferToAccountId: z.number().int().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  recurringRuleId: z.number().int().nullable().optional(),
});

const transactionUpdateSchema = transactionSchema.partial();

function parseFilters(query: Record<string, unknown>): transactionsService.TransactionFilters {
  const type = query.type;
  return {
    accountId: query.accountId ? Number(query.accountId) : undefined,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    from: typeof query.from === "string" ? query.from : undefined,
    to: typeof query.to === "string" ? query.to : undefined,
    type: type === "income" || type === "expense" || type === "transfer" ? type : undefined,
  };
}

transactionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(transactionsService.listTransactions(parseFilters(req.query as Record<string, unknown>)));
  }),
);

transactionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(transactionsService.getTransaction(Number(req.params.id)));
  }),
);

transactionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = transactionSchema.parse(req.body);
    res.status(201).json(transactionsService.createTransaction(input));
  }),
);

transactionsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = transactionUpdateSchema.parse(req.body);
    res.json(transactionsService.updateTransaction(Number(req.params.id), input));
  }),
);

transactionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    transactionsService.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  }),
);
