import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import { SUPPORTED_CURRENCIES } from "../../shared/currencies";
import * as currencyService from "./currency.service";

export const currencyRouter = Router();

currencyRouter.get(
  "/list",
  asyncHandler(async (_req, res) => {
    res.json(SUPPORTED_CURRENCIES);
  }),
);

currencyRouter.get(
  "/rates",
  asyncHandler(async (_req, res) => {
    res.json(currencyService.getRatesSummary());
  }),
);

currencyRouter.put(
  "/base",
  asyncHandler(async (req, res) => {
    const { currency } = z.object({ currency: z.string().length(3) }).parse(req.body);
    currencyService.setBaseCurrency(currency);
    res.json(currencyService.getRatesSummary());
  }),
);

currencyRouter.post(
  "/refresh",
  asyncHandler(async (_req, res) => {
    await currencyService.refreshRates();
    res.json(currencyService.getRatesSummary());
  }),
);
