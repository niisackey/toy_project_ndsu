import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Search, Trash2 } from "lucide-react";
import { createTransaction, deleteTransaction } from "../api/transactions";
import { PageLayout } from "../components/layout/PageLayout";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { usePagination } from "../hooks/usePagination";
import { useTransactions } from "../hooks/useTransactions";
import { formatMoney } from "../lib/currency";
import type { TransactionType } from "../types";

const typeBadge: Record<TransactionType, "success" | "destructive" | "secondary"> = {
  income: "success",
  expense: "destructive",
  transfer: "secondary",
};

export default function TransactionsPage() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { transactions, loading, refresh } = useTransactions();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterAccountId, setFilterAccountId] = useState<number | "all">("all");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (query && !(t.description ?? "").toLowerCase().includes(query)) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterAccountId !== "all" && t.accountId !== filterAccountId && t.transferToAccountId !== filterAccountId)
        return false;
      if (filterCategoryId !== "all" && t.categoryId !== filterCategoryId) return false;
      return true;
    });
  }, [transactions, search, filterType, filterAccountId, filterCategoryId]);

  const { pageItems, page, pageCount, setPage } = usePagination(filteredTransactions, 10);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterAccountId, filterCategoryId, setPage]);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [transferToAccountId, setTransferToAccountId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  function accountName(id: number): string {
    return accounts.find((a) => a.id === id)?.name ?? `#${id}`;
  }
  function accountCurrency(id: number): string {
    return accounts.find((a) => a.id === id)?.currency ?? "USD";
  }
  function categoryName(id: number | null): string {
    if (id === null) return "-";
    return categories.find((c) => c.id === id)?.name ?? `#${id}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    try {
      await createTransaction({
        type,
        amount: Number(amount),
        date,
        description: description || null,
        accountId: Number(accountId),
        transferToAccountId: type === "transfer" ? Number(transferToAccountId) : null,
        categoryId: type !== "transfer" && categoryId ? Number(categoryId) : null,
      });
      setAmount("");
      setDescription("");
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    await refresh();
  }

  return (
    <PageLayout
      title="Transactions"
      subtitle="Log income, expenses, and transfers between accounts"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Add transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account">{type === "transfer" ? "From account" : "Account"}</Label>
                <Select value={accountId ? String(accountId) : ""} onValueChange={(v) => setAccountId(Number(v))}>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name} ({a.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {type === "transfer" && (
                <div className="space-y-1.5">
                  <Label htmlFor="toAccount">To account</Label>
                  <Select
                    value={transferToAccountId ? String(transferToAccountId) : ""}
                    onValueChange={(v) => setTransferToAccountId(Number(v))}
                  >
                    <SelectTrigger id="toAccount">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name} ({a.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {type !== "transfer" && (
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={categoryId ? String(categoryId) : "none"}
                    onValueChange={(v) => setCategoryId(v === "none" ? "" : Number(v))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Plus size={16} /> Add transaction
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as TransactionType | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(filterAccountId)}
          onValueChange={(v) => setFilterAccountId(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(filterCategoryId)}
          onValueChange={(v) => setFilterCategoryId(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filteredTransactions.length === 0 ? (
        <p className="empty-state">No transactions match your filters.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                  <TableCell>
                    <Badge variant={typeBadge[t.type]} className="capitalize">
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.description ?? "-"}</TableCell>
                  <TableCell>
                    {accountName(t.accountId)}
                    {t.transferToAccountId ? ` -> ${accountName(t.transferToAccountId)}` : ""}
                  </TableCell>
                  <TableCell>{categoryName(t.categoryId)}</TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(t.amount, accountCurrency(t.accountId))}
                    {t.transferToAccountId && t.transferAmountConverted !== null && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (-&gt; {formatMoney(t.transferAmountConverted, accountCurrency(t.transferToAccountId))})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} /> Delete
                    </Button>
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
