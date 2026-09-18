import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as categoriesService from "./categories.service";

export const categoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().nullable().optional(),
});

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(categoriesService.listCategories());
  }),
);

categoriesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = categorySchema.parse(req.body);
    res.status(201).json(categoriesService.createCategory(input));
  }),
);

categoriesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = categorySchema.partial().parse(req.body);
    res.json(categoriesService.updateCategory(Number(req.params.id), input));
  }),
);

categoriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    categoriesService.deleteCategory(Number(req.params.id));
    res.status(204).send();
  }),
);
