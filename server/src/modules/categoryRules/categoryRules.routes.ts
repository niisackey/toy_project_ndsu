import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as categoryRulesService from "./categoryRules.service";

export const categoryRulesRouter = Router();

const categoryRuleSchema = z.object({
  keyword: z.string().min(1),
  categoryId: z.number().int(),
});

categoryRulesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(categoryRulesService.listCategoryRules());
  }),
);

categoryRulesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = categoryRuleSchema.parse(req.body);
    res.status(201).json(categoryRulesService.createCategoryRule(input));
  }),
);

categoryRulesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    categoryRulesService.deleteCategoryRule(Number(req.params.id));
    res.status(204).send();
  }),
);
