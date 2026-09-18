import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { HandCoins } from "lucide-react";
import { createTransaction } from "../../api/transactions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Account } from "../../types";

export function MakePaymentDialog({
  card,
  accounts,
  onPaid,
}: {
  card: Account;
  accounts: Account[];
  onPaid: () => Promise<void>;
}) {
  const sourceAccounts = accounts.filter((a) => a.type !== "credit_card");

  const [open, setOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setFromAccountId(sourceAccounts[0]?.id ?? "");
      setAmount(card.balance > 0 ? card.balance.toFixed(2) : "");
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fromAccountId) return;
    setSubmitting(true);
    try {
      await createTransaction({
        type: "transfer",
        amount: Number(amount),
        date,
        description: `Payment to ${card.name}`,
        accountId: Number(fromAccountId),
        transferToAccountId: card.id,
      });
      setOpen(false);
      await onPaid();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HandCoins size={14} /> Make a payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay down {card.name}</DialogTitle>
        </DialogHeader>
        {sourceAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need a checking, cash, or savings account to pay from - add one on the Accounts
            page first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`from-${card.id}`}>Pay from</Label>
              <Select
                value={fromAccountId ? String(fromAccountId) : ""}
                onValueChange={(v) => setFromAccountId(Number(v))}
              >
                <SelectTrigger id={`from-${card.id}`}>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {sourceAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} (${a.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`amount-${card.id}`}>Amount</Label>
              <Input
                id={`amount-${card.id}`}
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current balance: ${card.balance.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`date-${card.id}`}>Date</Label>
              <Input
                id={`date-${card.id}`}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                <HandCoins size={16} /> Make payment
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
