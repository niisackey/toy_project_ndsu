import { useState, type FormEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { updateAccount } from "../../api/accounts";
import { utilizationBarClass } from "../charts/chartColors";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { MakePaymentDialog } from "./MakePaymentDialog";
import type { Account } from "../../types";

export function AccountCard({
  account,
  accounts,
  onDelete,
  onUpdated,
}: {
  account: Account;
  accounts: Account[];
  onDelete: (id: number) => void;
  onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [initialBalance, setInitialBalance] = useState(String(account.initialBalance));
  const [creditLimit, setCreditLimit] = useState(
    account.creditLimit != null ? String(account.creditLimit) : "",
  );
  const [statementClosingDay, setStatementClosingDay] = useState(
    account.statementClosingDay != null ? String(account.statementClosingDay) : "",
  );
  const [paymentDueDay, setPaymentDueDay] = useState(
    account.paymentDueDay != null ? String(account.paymentDueDay) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  function resetFields() {
    setName(account.name);
    setInitialBalance(String(account.initialBalance));
    setCreditLimit(account.creditLimit != null ? String(account.creditLimit) : "");
    setStatementClosingDay(
      account.statementClosingDay != null ? String(account.statementClosingDay) : "",
    );
    setPaymentDueDay(account.paymentDueDay != null ? String(account.paymentDueDay) : "");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateAccount(account.id, {
        name,
        initialBalance: Number(initialBalance),
        creditLimit: account.type === "credit_card" ? Number(creditLimit) || 0 : null,
        statementClosingDay:
          account.type === "credit_card" && statementClosingDay
            ? Number(statementClosingDay)
            : null,
        paymentDueDay:
          account.type === "credit_card" && paymentDueDay ? Number(paymentDueDay) : null,
      });
      setEditing(false);
      await onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    resetFields();
    setEditing(false);
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`name-${account.id}`}>Name</Label>
              <Input
                id={`name-${account.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`balance-${account.id}`}>
                {account.type === "credit_card" ? "Starting balance owed" : "Initial balance"}
              </Label>
              <Input
                id={`balance-${account.id}`}
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>
            {account.type === "credit_card" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor={`limit-${account.id}`}>Credit limit</Label>
                  <Input
                    id={`limit-${account.id}`}
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`closing-${account.id}`}>Statement closing day</Label>
                  <Input
                    id={`closing-${account.id}`}
                    type="number"
                    min={1}
                    max={28}
                    placeholder="e.g. 20"
                    value={statementClosingDay}
                    onChange={(e) => setStatementClosingDay(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`due-${account.id}`}>Payment due day</Label>
                  <Input
                    id={`due-${account.id}`}
                    type="number"
                    min={1}
                    max={28}
                    placeholder="e.g. 15"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={submitting} size="sm">
                <Check size={14} /> Save
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X size={14} /> Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {account.type.replace("_", " ")}
        </div>
        <h3 className="my-1 text-base font-semibold">{account.name}</h3>
        <div className="text-2xl font-extrabold tracking-tight">${account.balance.toFixed(2)}</div>
        {account.type === "credit_card" && account.creditLimit && (
          <>
            <Progress
              value={Math.min(100, account.utilizationPct ?? 0)}
              className="my-2.5"
              indicatorClassName={utilizationBarClass(account.utilizationPct ?? 0)}
            />
            <p className="text-sm text-muted-foreground">
              {account.utilizationPct}% of ${account.creditLimit} limit
            </p>
            {account.nextStatementClosingDate && (
              <p className="text-sm text-muted-foreground">
                Statement closes {account.nextStatementClosingDate}
              </p>
            )}
            {account.nextPaymentDueDate && (
              <p className="text-sm text-muted-foreground">
                Payment due {account.nextPaymentDueDate}
              </p>
            )}
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {account.type === "credit_card" && (
            <MakePaymentDialog card={account} accounts={accounts} onPaid={onUpdated} />
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(account.id)}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
