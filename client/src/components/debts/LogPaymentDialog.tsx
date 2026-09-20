import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { HandCoins } from "lucide-react";
import { logDebtPayment } from "../../api/debts";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { formatMoney } from "../../lib/currency";
import type { Debt } from "../../types";

export function LogPaymentDialog({ debt, onLogged }: { debt: Debt; onLogged: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setAmount(debt.remainingAmount.toFixed(2));
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logDebtPayment(debt.id, { amount: Number(amount), date });
      setOpen(false);
      await onLogged();
    } finally {
      setSubmitting(false);
    }
  }

  const verb = debt.direction === "lent" ? "Repaid by" : "Repaid to";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HandCoins size={14} /> Log payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {verb} {debt.personName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`amount-${debt.id}`}>Amount ({debt.currency})</Label>
            <Input
              id={`amount-${debt.id}`}
              type="number"
              step="0.01"
              max={debt.remainingAmount}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Remaining balance: {formatMoney(debt.remainingAmount, debt.currency)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`date-${debt.id}`}>Date</Label>
            <Input
              id={`date-${debt.id}`}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              <HandCoins size={16} /> Log payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
