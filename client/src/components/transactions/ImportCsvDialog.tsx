import { useState, type ChangeEvent, type FormEvent } from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { Upload } from "lucide-react";
import { importTransactions, type ImportRow } from "../../api/transactions";
import { useToast } from "../../hooks/use-toast";
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
import { parseCsv } from "../../lib/csv";
import type { Account } from "../../types";

const DATE_FORMATS = ["yyyy-MM-dd", "MM/dd/yyyy", "M/d/yyyy", "MM-dd-yyyy"];

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iso = parseISO(trimmed);
  if (isValid(iso)) return format(iso, "yyyy-MM-dd");
  for (const pattern of DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  }
  return null;
}

function parseRows(text: string, hasHeader: boolean): { rows: ImportRow[]; skipped: number } {
  const parsed = parseCsv(text);
  const dataRows = hasHeader ? parsed.slice(1) : parsed;
  const rows: ImportRow[] = [];
  let skipped = 0;

  for (const cells of dataRows) {
    if (cells.length < 3) {
      if (cells.some((c) => c.trim())) skipped++;
      continue;
    }
    const date = normalizeDate(cells[0]);
    const description = cells[1]?.trim() || null;
    const amount = Number(cells[2].replace(/[^0-9.-]/g, ""));
    if (!date || Number.isNaN(amount)) {
      skipped++;
      continue;
    }
    rows.push({ date, description, amount });
  }

  return { rows, skipped };
}

export function ImportCsvDialog({
  accounts,
  onImported,
}: {
  accounts: Account[];
  onImported: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<number | "">("");
  const [hasHeader, setHasHeader] = useState(true);
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  function resetState() {
    setAccountId(accounts[0]?.id ?? "");
    setHasHeader(true);
    setFileName("");
    setFileText("");
    setParsedRows([]);
    setSkippedCount(0);
  }

  function applyParse(text: string, withHeader: boolean) {
    const { rows, skipped } = parseRows(text, withHeader);
    setParsedRows(rows);
    setSkippedCount(skipped);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setFileText(text);
      applyParse(text, hasHeader);
    };
    reader.readAsText(file);
  }

  function handleHeaderToggle(checked: boolean) {
    setHasHeader(checked);
    if (fileText) applyParse(fileText, checked);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId || parsedRows.length === 0) return;
    setSubmitting(true);
    try {
      const result = await importTransactions(Number(accountId), parsedRows);
      toast(
        `Imported ${result.importedCount} transaction${result.importedCount === 1 ? "" : "s"}, ${result.categorizedCount} auto-categorized.`,
        "success",
      );
      setOpen(false);
      await onImported();
    } catch {
      toast("Import failed - check the file and try again.", "destructive");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload size={16} /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import transactions from CSV</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="account">Import into account</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="file">CSV file</Label>
            <Input id="file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              Three columns: date, description, amount. Amount is signed - negative for
              expenses, positive for income (the standard bank export format). The first row is
              assumed to be a header and skipped.
            </p>
            <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => handleHeaderToggle(e.target.checked)}
              />
              File has a header row
            </label>
          </div>
          {fileName && (
            <p className="text-sm text-muted-foreground">
              {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"} ready to import
              {skippedCount > 0 && `, ${skippedCount} skipped (couldn't parse)`}.
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting || !accountId || parsedRows.length === 0}>
              <Upload size={16} /> Import {parsedRows.length > 0 ? parsedRows.length : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
