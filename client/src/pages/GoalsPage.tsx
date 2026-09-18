import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createGoal, deleteGoal } from "../api/goals";
import { PageLayout } from "../components/layout/PageLayout";
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
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAccounts } from "../hooks/useAccounts";
import { useGoals } from "../hooks/useGoals";

export default function GoalsPage() {
  const { accounts } = useAccounts();
  const { goals, loading, refresh } = useGoals();
  const savingsAccounts = accounts.filter((a) => a.type !== "credit_card");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!linkedAccountId) return;
    setSubmitting(true);
    try {
      await createGoal({
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || null,
        linkedAccountId: Number(linkedAccountId),
      });
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteGoal(id);
    await refresh();
  }

  return (
    <PageLayout
      title="Savings goals"
      subtitle="Set a target and watch your progress toward it"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Add goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a savings goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Goal name</Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Buy a car"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetAmount">Target amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetDate">Target date (optional)</Label>
                <Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedAccount">Linked savings account</Label>
                <Select
                  value={linkedAccountId ? String(linkedAccountId) : ""}
                  onValueChange={(v) => setLinkedAccountId(Number(v))}
                >
                  <SelectTrigger id="linkedAccount">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsAccounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A goal's progress tracks the balance of this account - e.g. open a savings
                  account just for this goal and watch it grow here.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Plus size={16} /> Add goal
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : goals.length === 0 ? (
        <p className="empty-state">No goals yet. Add one to start tracking progress.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <Card key={g.id}>
              <CardContent className="pt-5">
                <h3 className="mb-1.5 text-base font-semibold">{g.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ${g.currentAmount.toFixed(2)} of ${g.targetAmount.toFixed(2)} ({g.linkedAccountName})
                </p>
                <Progress value={g.progressPct} className="my-2.5" />
                <p className="text-sm text-muted-foreground">{g.progressPct}% complete</p>
                {g.projectedCompletionDate ? (
                  <p className="mt-1 text-sm">
                    At your recent savings pace (~${g.monthlyRate.toFixed(2)}/mo), projected to
                    reach this goal by <strong>{g.projectedCompletionDate}</strong>.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add more savings history to project a completion date.
                  </p>
                )}
                {g.targetDate && <p className="mt-1 text-sm text-muted-foreground">Target date: {g.targetDate}</p>}
                <Button variant="outline" size="sm" className="mt-3" onClick={() => handleDelete(g.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
