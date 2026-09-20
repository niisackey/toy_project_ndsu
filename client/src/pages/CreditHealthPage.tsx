import { useState, type FormEvent } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Calendar, Check, Clock } from "lucide-react";
import { logCardPayment } from "../api/credit";
import { MakePaymentDialog } from "../components/accounts/MakePaymentDialog";
import { PageLayout } from "../components/layout/PageLayout";
import { STATUS, utilizationBarClass } from "../components/charts/chartColors";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { MonthPicker } from "../components/ui/month-picker";
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAccounts } from "../hooks/useAccounts";
import { useCreditHealth } from "../hooks/useCreditHealth";
import { formatMoney } from "../lib/currency";

function scoreColor(score: number): string {
  if (score >= 740) return STATUS.good;
  if (score >= 670) return STATUS.warning;
  if (score >= 580) return STATUS.serious;
  return STATUS.critical;
}

function dueBadgeVariant(days: number): "destructive" | "warning" | "success" {
  if (days <= 2) return "destructive";
  if (days <= 7) return "warning";
  return "success";
}

function dueLabel(days: number): string {
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export default function CreditHealthPage() {
  const { health, loading, refresh } = useCreditHealth();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const cards = accounts.filter((a) => a.type === "credit_card");

  async function refreshAll() {
    await Promise.all([refresh(), refreshAccounts()]);
  }

  const [accountId, setAccountId] = useState<number | "">("");
  const [statementMonth, setStatementMonth] = useState(format(new Date(), "yyyy-MM"));
  const [paidOnTime, setPaidOnTime] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    try {
      await logCardPayment({ accountId: Number(accountId), statementMonth, paidOnTime });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !health) {
    return (
      <PageLayout title="Credit Health" subtitle="A simulated score and tips for building credit wisely">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Credit Health" subtitle="A simulated score and tips for building credit wisely">
      <Card className="mb-8">
        <CardContent className="pt-5">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-extrabold tracking-tight" style={{ color: scoreColor(health.simulatedScore) }}>
              {health.simulatedScore}
            </span>
            <Badge variant={health.simulatedScore >= 670 ? "success" : health.simulatedScore >= 580 ? "warning" : "destructive"}>
              {health.scoreRangeLabel}
            </Badge>
          </div>
          <p className="mt-2.5 text-xs italic text-muted-foreground">{health.disclaimer}</p>

          <div className="mt-4">
            {health.factors.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-none">
                <div>
                  <strong className="text-sm font-semibold">{f.label}</strong>{" "}
                  <span className="text-sm text-muted-foreground">({f.weightPct}% weight)</span>
                  <div className="text-sm text-muted-foreground">{f.explanation}</div>
                </div>
                <div className="font-bold">{f.scoreOutOf100}/100</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Card utilization</h2>
        {health.cardUtilization.length === 0 ? (
          <p className="empty-state">No credit cards on file yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {health.cardUtilization.map((c) => {
              const account = accounts.find((a) => a.id === c.accountId);
              const dueDays = account?.nextPaymentDueDate
                ? differenceInCalendarDays(parseISO(account.nextPaymentDueDate), new Date())
                : null;
              const closingDays = account?.nextStatementClosingDate
                ? differenceInCalendarDays(parseISO(account.nextStatementClosingDate), new Date())
                : null;
              return (
                <Card key={c.accountId}>
                  <CardContent className="pt-5">
                    <h3 className="mb-1.5 text-base font-semibold">{c.accountName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(c.balance, c.currency)} of {formatMoney(c.creditLimit, c.currency)}
                    </p>
                    <Progress
                      value={Math.min(100, c.utilizationPct)}
                      className="my-2.5"
                      indicatorClassName={utilizationBarClass(c.utilizationPct)}
                    />
                    <p className="text-sm">
                      {c.utilizationPct}% - {c.advice}
                    </p>
                    {dueDays !== null && account?.nextPaymentDueDate && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Clock size={14} className="text-muted-foreground" />
                        <Badge variant={dueBadgeVariant(dueDays)}>
                          Payment {dueLabel(dueDays)} ({account.nextPaymentDueDate})
                        </Badge>
                      </div>
                    )}
                    {closingDays !== null && account?.nextStatementClosingDate && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Statement closes {dueLabel(closingDays)} ({account.nextStatementClosingDate})
                        </span>
                      </div>
                    )}
                    {account && (
                      <div className="mt-3">
                        <MakePaymentDialog card={account} accounts={accounts} onPaid={refreshAll} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Log a statement payment</h2>
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="card">Card</Label>
                <Select value={accountId ? String(accountId) : ""} onValueChange={(v) => setAccountId(Number(v))}>
                  <SelectTrigger id="card">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statementMonth">Statement month</Label>
                <MonthPicker id="statementMonth" value={statementMonth} onChange={setStatementMonth} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paidOnTime">Paid on time?</Label>
                <Select value={paidOnTime ? "yes" : "no"} onValueChange={(v) => setPaidOnTime(v === "yes")}>
                  <SelectTrigger id="paidOnTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submitting} className="sm:col-span-3 sm:w-fit">
                <Check size={16} /> Log payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Building credit wisely</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {health.educationTips.map((tip) => (
            <Card key={tip.id}>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-sm text-muted-foreground">{tip.detail}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
