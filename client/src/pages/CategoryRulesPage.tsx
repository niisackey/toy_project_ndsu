import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createCategoryRule, deleteCategoryRule } from "../api/categoryRules";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useCategories } from "../hooks/useCategories";
import { useCategoryRules } from "../hooks/useCategoryRules";

export default function CategoryRulesPage() {
  const { categories } = useCategories();
  const { rules, loading, refresh } = useCategoryRules();

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) return;
    setSubmitting(true);
    try {
      await createCategoryRule({ keyword, categoryId: Number(categoryId) });
      setKeyword("");
      setCategoryId("");
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteCategoryRule(id);
    await refresh();
  }

  return (
    <PageLayout
      title="Category rules"
      subtitle="Transactions whose description contains a keyword are categorized automatically when you don't pick a category yourself"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Add rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a category rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  required
                  placeholder="e.g. netflix"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Matches anywhere in a transaction's description, case-insensitive.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId ? String(categoryId) : ""} onValueChange={(v) => setCategoryId(Number(v))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Plus size={16} /> Add rule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rules.length === 0 ? (
        <p className="empty-state">
          No rules yet. Add one so matching transactions get categorized automatically.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Category</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.keyword}</TableCell>
                <TableCell>{r.categoryName}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageLayout>
  );
}
