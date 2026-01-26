import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wallet, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toStringId } from "@/lib/id-utils";

type ExpenseCategory = "fuel" | "charging" | "toll" | "commission" | "repair" | "maintenance" | "other";

export default function Ledger() {
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ledger, isLoading } = useQuery({
    queryKey: ["ledger"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger")
        .select(`*, cars(plate_number), drivers(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ledger").insert({
        entry_type: entryType,
        category: entryType === "expense" ? category : null,
        amount,
        description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast({ title: "Entry added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEntryType("expense");
    setCategory("other");
    setAmount(0);
    setDescription("");
  };

  const incomeEntries = ledger?.filter(e => e.entry_type === "income") || [];
  const expenseEntries = ledger?.filter(e => e.entry_type === "expense") || [];
  
  const totalIncome = incomeEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = expenseEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      fuel: "⛽ Fuel",
      charging: "⚡ Charging",
      toll: "🛣️ Toll",
      commission: "👤 Commission",
      repair: "🔧 Repair",
      maintenance: "🛠️ Maintenance",
      other: "📋 Other",
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Ledger</h1>
          <p className="text-muted-foreground">Track income and expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Ledger Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addEntry.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Entry Type</Label>
                <Select value={entryType} onValueChange={(v) => setEntryType(v as "income" | "expense")}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Income</SelectItem>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {entryType === "expense" && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">⛽ Fuel</SelectItem>
                      <SelectItem value="charging">⚡ Charging</SelectItem>
                      <SelectItem value="toll">🛣️ Toll</SelectItem>
                      <SelectItem value="commission">👤 Driver Commission</SelectItem>
                      <SelectItem value="repair">🔧 Repair</SelectItem>
                      <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0}
                  step="0.01"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Trip fare from NYC to Boston"
                  className="bg-muted"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addEntry.isPending}>
                {addEntry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/15 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/15 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${netProfit.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-success/15' : 'bg-destructive/15'}`}>
                <Wallet className={`w-6 h-6 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="income">💰 Income</TabsTrigger>
          <TabsTrigger value="expense">💸 Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LedgerTable entries={ledger || []} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
        </TabsContent>
        <TabsContent value="income">
          <LedgerTable entries={incomeEntries} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
        </TabsContent>
        <TabsContent value="expense">
          <LedgerTable entries={expenseEntries} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LedgerTable({ entries, isLoading, getCategoryLabel }: { entries: any[]; isLoading: boolean; getCategoryLabel: (cat: string) => string }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={toStringId(entry.id)} className="border-border hover:bg-muted/30">
                    <TableCell>{format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <StatusBadge variant={entry.entry_type === "income" ? "available" : "busy"}>
                        {entry.entry_type === "income" ? "Income" : "Expense"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {entry.category ? getCategoryLabel(entry.category) : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className={`font-medium ${entry.entry_type === "income" ? "text-success" : "text-destructive"}`}>
                      {entry.entry_type === "income" ? "+" : "-"}${Number(entry.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
