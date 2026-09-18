import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as goalsService from "./goals.service";

export const goalsRouter = Router();

const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.string().nullable().optional(),
  linkedAccountId: z.number().int(),
});

goalsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(goalsService.listGoals());
  }),
);

goalsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(goalsService.getGoal(Number(req.params.id)));
  }),
);

goalsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = goalSchema.parse(req.body);
    res.status(201).json(goalsService.createGoal(input));
  }),
);

goalsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = goalSchema.partial().parse(req.body);
    res.json(goalsService.updateGoal(Number(req.params.id), input));
  }),
);

goalsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    goalsService.deleteGoal(Number(req.params.id));
    res.status(204).send();
  }),
);
