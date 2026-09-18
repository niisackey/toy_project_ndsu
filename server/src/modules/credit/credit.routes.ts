import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as creditService from "./credit.service";

export const creditRouter = Router();

const paymentSchema = z.object({
  accountId: z.number().int(),
  statementMonth: z.string().regex(/^\d{4}-\d{2}$/, "statementMonth must be YYYY-MM"),
  paidOnTime: z.boolean(),
});

creditRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    res.json(creditService.getCreditHealth());
  }),
);

creditRouter.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    res.json(creditService.listCardPayments(accountId));
  }),
);

creditRouter.post(
  "/payments",
  asyncHandler(async (req, res) => {
    const input = paymentSchema.parse(req.body);
    res.status(201).json(creditService.logCardPayment(input));
  }),
);
