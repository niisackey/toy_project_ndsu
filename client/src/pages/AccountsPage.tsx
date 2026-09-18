import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { createAccount, deleteAccount } from "../api/accounts";
import { AccountCard } from "../components/accounts/AccountCard";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAccounts } from "../hooks/useAccounts";
import type { AccountType } from "../types";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "cash", label: "Cash" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit card" },
];

export default function AccountsPage() {
  const { accounts, loading, refresh } = useAccounts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [initialBalance, setInitialBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [nextStatementClosingDate, setNextStatementClosingDate] = useState("");
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setType("checking");
    setInitialBalance("0");
    setCreditLimit("");
    setNextStatementClosingDate("");
    setNextPaymentDueDate("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAccount({
        name,
        type,
        initialBalance: Number(initialBalance),
        creditLimit: type === "credit_card" ? Number(creditLimit) || 0 : null,
        nextStatementClosingDate:
          type === "credit_card" && nextStatementClosingDate ? nextStatementClosingDate : null,
        nextPaymentDueDate:
          type === "credit_card" && nextPaymentDueDate ? nextPaymentDueDate : null,
      });
      resetForm();
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this account? This only works if it has no transactions.")) return;
    try {
      await deleteAccount(id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  return (
    <PageLayout
      title="Accounts"
      subtitle="Checking, cash, savings, and credit cards - all in one place"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Add account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="initialBalance">
                  {type === "credit_card" ? "Starting balance owed" : "Initial balance"}
                </Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                />
              </div>
              {type === "credit_card" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="creditLimit">Credit limit</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nextStatementClosingDate">Next statement closing date</Label>
                    <Input
                      id="nextStatementClosingDate"
                      type="date"
                      value={nextStatementClosingDate}
                      onChange={(e) => setNextStatementClosingDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nextPaymentDueDate">Next payment due date</Label>
                    <Input
                      id="nextPaymentDueDate"
                      type="date"
                      value={nextPaymentDueDate}
                      onChange={(e) => setNextPaymentDueDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use the actual date from your statement - it can be weeks or months out,
                      the app rolls it forward automatically once it passes.
                    </p>
                  </div>
                </>
              )}
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Plus size={16} /> Add account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              accounts={accounts}
              onDelete={handleDelete}
              onUpdated={refresh}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
