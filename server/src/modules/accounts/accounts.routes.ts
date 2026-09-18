import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as accountsService from "./accounts.service";

export const accountsRouter = Router();

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["checking", "cash", "savings", "credit_card"]),
  initialBalance: z.number(),
  creditLimit: z.number().positive().nullable().optional(),
  statementClosingDay: z.number().int().min(1).max(28).nullable().optional(),
  paymentDueDay: z.number().int().min(1).max(28).nullable().optional(),
});

const accountUpdateSchema = accountSchema.partial();

accountsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(accountsService.listAccounts());
  }),
);

accountsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(accountsService.getAccount(Number(req.params.id)));
  }),
);

accountsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = accountSchema.parse(req.body);
    res.status(201).json(accountsService.createAccount(input));
  }),
);

accountsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = accountUpdateSchema.parse(req.body);
    res.json(accountsService.updateAccount(Number(req.params.id), input));
  }),
);

accountsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    accountsService.deleteAccount(Number(req.params.id));
    res.status(204).send();
  }),
);
