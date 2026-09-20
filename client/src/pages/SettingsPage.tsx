import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchCurrencyList, fetchRates, refreshRates, setBaseCurrency } from "../api/currency";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useToast } from "../hooks/use-toast";
import type { CurrencyInfo } from "../lib/currency";
import type { RatesSummary } from "../types";

export default function SettingsPage() {
  const [rates, setRates] = useState<RatesSummary | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRates().then(setRates);
    fetchCurrencyList().then(setCurrencies);
  }, []);

  function currencyName(code: string): string {
    return currencies.find((c) => c.code === code)?.name ?? code;
  }

  async function handleBaseChange(currency: string) {
    setSaving(true);
    try {
      const updated = await setBaseCurrency(currency);
      setRates(updated);
      toast(`Base currency set to ${currency}.`, "success");
    } catch {
      toast("Couldn't update the base currency.", "destructive");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const updated = await refreshRates();
      setRates(updated);
      toast("Exchange rates refreshed.", "success");
    } catch {
      toast("Couldn't refresh exchange rates - check your connection.", "destructive");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <PageLayout title="Settings" subtitle="Base currency and exchange rates">
      <div className="mb-8 max-w-sm space-y-1.5">
        <Label htmlFor="baseCurrency">Base currency</Label>
        <Select value={rates?.baseCurrency ?? ""} onValueChange={handleBaseChange} disabled={saving || !rates}>
          <SelectTrigger id="baseCurrency">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Dashboard totals, budgets, and reports convert every account into this currency.
        </p>
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight">Exchange rates</h2>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} /> Refresh rates now
        </Button>
      </div>
      {rates?.lastFetchedAt && (
        <p className="-mt-2 mb-3 text-sm text-muted-foreground">Last updated: {rates.lastFetchedAt}</p>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Rate (per USD)</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates?.rates.map((r) => (
                <TableRow key={r.currency}>
                  <TableCell className="font-medium">
                    {r.currency} - {currencyName(r.currency)}
                  </TableCell>
                  <TableCell>{r.rateToUsd.toFixed(4)}</TableCell>
                  <TableCell>{r.live ? "Live" : "Fallback"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
