import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as debtsService from "./debts.service";

export const debtsRouter = Router();

const createDebtSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personName: z.string().min(1),
  principalAmount: z.number().positive(),
  accountId: z.number().int(),
  description: z.string().nullable().optional(),
  date: z.string(),
  dueDate: z.string().nullable().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string(),
});

debtsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(debtsService.listDebts());
  }),
);

debtsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(debtsService.getDebt(Number(req.params.id)));
  }),
);

debtsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createDebtSchema.parse(req.body);
    res.status(201).json(debtsService.createDebt(input));
  }),
);

debtsRouter.post(
  "/:id/payments",
  asyncHandler(async (req, res) => {
    const input = paymentSchema.parse(req.body);
    res.status(201).json(debtsService.logDebtPayment(Number(req.params.id), input));
  }),
);

debtsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    debtsService.deleteDebt(Number(req.params.id));
    res.status(204).send();
  }),
);
