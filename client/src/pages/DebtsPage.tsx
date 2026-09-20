import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2 } from "lucide-react";
import { createDebt, deleteDebt } from "../api/debts";
import { PageLayout } from "../components/layout/PageLayout";
import { LogPaymentDialog } from "../components/debts/LogPaymentDialog";
import { Badge } from "../components/ui/badge";
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
import { Pagination } from "../components/ui/pagination";
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { formatMoney } from "../lib/currency";
import { useAccounts } from "../hooks/useAccounts";
import { useDebts } from "../hooks/useDebts";
import { usePagination } from "../hooks/usePagination";
import type { DebtDirection, DebtStatus } from "../types";

export default function DebtsPage() {
  const { accounts } = useAccounts();
  const { debts, loading, refresh } = useDebts();
  const eligibleAccounts = accounts.filter((a) => a.type !== "credit_card");

  const [search, setSearch] = useState("");
  const [filterDirection, setFilterDirection] = useState<"all" | DebtDirection>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DebtStatus>("all");

  const filteredDebts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return debts.filter((d) => {
      if (
        query &&
        !d.personName.toLowerCase().includes(query) &&
        !(d.description ?? "").toLowerCase().includes(query)
      )
        return false;
      if (filterDirection !== "all" && d.direction !== filterDirection) return false;
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      return true;
    });
  }, [debts, search, filterDirection, filterStatus]);

  const { pageItems, page, pageCount, setPage } = usePagination(filteredDebts, 10);

  useEffect(() => {
    setPage(1);
  }, [search, filterDirection, filterStatus, setPage]);

  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<DebtDirection>("lent");
  const [personName, setPersonName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setDirection("lent");
    setPersonName("");
    setPrincipalAmount("");
    setAccountId(eligibleAccounts[0]?.id ?? "");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    try {
      await createDebt({
        direction,
        personName,
        principalAmount: Number(principalAmount),
        accountId: Number(accountId),
        description: description || null,
        date,
        dueDate: dueDate || null,
      });
      resetForm();
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteDebt(id);
    await refresh();
  }

  return (
    <PageLayout
      title="Debts"
      subtitle="Money you've borrowed or lent to people - track it and mark it settled once it's paid back"
      actions={
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Log a debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a debt</DialogTitle>
            </DialogHeader>
            {eligibleAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You need a checking, cash, or savings account first - add one on the Accounts page.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="direction">Direction</Label>
                  <Select value={direction} onValueChange={(v) => setDirection(v as DebtDirection)}>
                    <SelectTrigger id="direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lent">I lent money to someone</SelectItem>
                      <SelectItem value="borrowed">I borrowed money from someone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personName">Person</Label>
                  <Input
                    id="personName"
                    required
                    placeholder="e.g. Kwame"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="principalAmount">Amount</Label>
                  <Input
                    id="principalAmount"
                    type="number"
                    step="0.01"
                    required
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account">{direction === "lent" ? "Paid from" : "Received into"}</Label>
                  <Select
                    value={accountId ? String(accountId) : ""}
                    onValueChange={(v) => setAccountId(Number(v))}
                  >
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name} ({a.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Note (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Rent help"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Expected repayment date (optional)</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    <Plus size={16} /> Log debt
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      {debts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search person or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterDirection} onValueChange={(v) => setFilterDirection(v as typeof filterDirection)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Lent & borrowed</SelectItem>
              <SelectItem value="lent">You lent</SelectItem>
              <SelectItem value="borrowed">You borrowed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : debts.length === 0 ? (
        <p className="empty-state">No debts logged yet. Add one to start tracking.</p>
      ) : filteredDebts.length === 0 ? (
        <p className="empty-state">No debts match your filters.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.personName}
                    {d.description && (
                      <div className="text-xs font-normal text-muted-foreground">{d.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {d.direction === "lent" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      {d.direction === "lent" ? "You lent" : "You borrowed"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatMoney(d.principalAmount, d.currency)}
                    {d.paidAmount > 0 && d.status === "open" && (
                      <Progress value={(d.paidAmount / d.principalAmount) * 100} className="mt-1.5 w-28" />
                    )}
                  </TableCell>
                  <TableCell>{formatMoney(d.remainingAmount, d.currency)}</TableCell>
                  <TableCell>{d.dueDate ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "paid" ? "success" : "warning"} className="capitalize">
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {d.status === "open" && <LogPaymentDialog debt={d} onLogged={refresh} />}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(d.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </PageLayout>
  );
}
