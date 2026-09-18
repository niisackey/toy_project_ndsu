import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { createBudget, deleteBudget } from "../api/budgets";
import { PageLayout } from "../components/layout/PageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { MonthPicker } from "../components/ui/month-picker";
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { useBudgets } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";
import { utilizationBarClass } from "../components/charts/chartColors";

export default function BudgetsPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { budgets, loading, refresh } = useBudgets(month);
  const { categories } = useCategories();

  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [limitAmount, setLimitAmount] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const enteredAmount = Number(limitAmount) || 0;
  const monthlyAmount = isYearly ? Math.round((enteredAmount / 12) * 100) / 100 : enteredAmount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) return;
    setSubmitting(true);
    try {
      await createBudget({
        categoryId: Number(categoryId),
        month,
        limitAmount: monthlyAmount,
        months: isYearly ? 12 : 1,
      });
      setLimitAmount("");
      setIsYearly(false);
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteBudget(id);
    await refresh();
  }

  return (
    <PageLayout
      title="Budgets"
      subtitle="Set monthly limits per category and track what you've spent"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Set budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a monthly budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId ? String(categoryId) : ""} onValueChange={(v) => setCategoryId(Number(v))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
                <Label htmlFor="isYearly" className="cursor-pointer text-sm text-foreground">
                  This is a yearly amount
                </Label>
                <Switch id="isYearly" checked={isYearly} onCheckedChange={setIsYearly} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="limit">{isYearly ? "Yearly amount" : "Monthly limit"}</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  required
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                />
                {isYearly && enteredAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    = ${monthlyAmount.toFixed(2)}/month, set for {month} through the following 11
                    months.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Plus size={16} /> {isYearly ? "Set 12-month budget" : "Set budget"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-5 max-w-[260px] space-y-1.5">
        <Label htmlFor="month">Month</Label>
        <MonthPicker id="month" value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : budgets.length === 0 ? (
        <p className="empty-state">No budgets set for {month} yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const pct = Math.min(100, Math.round((b.spent / b.limitAmount) * 100));
            const over = b.spent > b.limitAmount;
            return (
              <Card key={b.id}>
                <CardContent className="pt-5">
                  <h3 className="mb-1.5 text-base font-semibold">{b.categoryName}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${b.spent.toFixed(2)} of ${b.limitAmount.toFixed(2)}
                  </p>
                  <Progress
                    value={pct}
                    className="my-2.5"
                    indicatorClassName={over ? "bg-destructive" : utilizationBarClass(pct)}
                  />
                  {over && <Badge variant="warning">Over budget</Badge>}
                  <div className="mt-2.5">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>
                      <Trash2 size={14} /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
