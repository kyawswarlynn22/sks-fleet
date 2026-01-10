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
import { useToast } from "@/hooks/use-toast";
import { Plus, Fuel, Battery, Zap, Droplet, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function EnergyLogs() {
  const [open, setOpen] = useState(false);
  const [carId, setCarId] = useState("");
  const [logType, setLogType] = useState<"charging" | "fueling">("fueling");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState(0);
  const [cost, setCost] = useState(0);
  const [kwh, setKwh] = useState<number | undefined>();
  const [pricePerUnit, setPricePerUnit] = useState<number | undefined>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["energy-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_logs")
        .select(`*, cars(plate_number, model, car_type)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*");
      if (error) throw error;
      return data;
    },
  });

  const addLog = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("energy_logs").insert({
        car_id: carId,
        log_type: logType,
        location,
        amount,
        cost,
        kwh: logType === "charging" ? kwh : null,
        price_per_unit: pricePerUnit,
      });
      if (error) throw error;

      // Also add to ledger
      await supabase.from("ledger").insert({
        entry_type: "expense",
        category: logType === "charging" ? "charging" : "fuel",
        amount: cost,
        description: `${logType === "charging" ? "Charging" : "Fuel"} at ${location}`,
        car_id: carId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-logs"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast({ title: "Energy log added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setCarId("");
    setLogType("fueling");
    setLocation("");
    setAmount(0);
    setCost(0);
    setKwh(undefined);
    setPricePerUnit(undefined);
  };

  const chargingLogs = logs?.filter(l => l.log_type === "charging") || [];
  const fuelingLogs = logs?.filter(l => l.log_type === "fueling") || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Energy & Maintenance</h1>
          <p className="text-muted-foreground">Track charging, fueling, and maintenance logs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Log
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Energy Log</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addLog.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={carId} onValueChange={setCarId} required>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars?.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.plate_number} - {car.model} ({car.car_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Log Type</Label>
                <Select value={logType} onValueChange={(v) => setLogType(v as "charging" | "fueling")}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charging">⚡ Charging (Electric)</SelectItem>
                    <SelectItem value="fueling">⛽ Fueling (Gas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Shell Station, Highway 101"
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{logType === "charging" ? "kWh Added" : "Gallons/Liters"}</Label>
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
                  <Label>Total Cost ($)</Label>
                  <Input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    required
                    className="bg-muted"
                  />
                </div>
              </div>
              {logType === "charging" && (
                <div className="space-y-2">
                  <Label>Price per kWh ($)</Label>
                  <Input
                    type="number"
                    value={pricePerUnit || ""}
                    onChange={(e) => setPricePerUnit(Number(e.target.value))}
                    min={0}
                    step="0.0001"
                    className="bg-muted"
                  />
                </div>
              )}
              {logType === "fueling" && (
                <div className="space-y-2">
                  <Label>Price per Gallon/Liter ($)</Label>
                  <Input
                    type="number"
                    value={pricePerUnit || ""}
                    onChange={(e) => setPricePerUnit(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="bg-muted"
                  />
                </div>
              )}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addLog.isPending}>
                {addLog.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Log
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="charging">⚡ Charging</TabsTrigger>
          <TabsTrigger value="fueling">⛽ Fueling</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EnergyTable logs={logs || []} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="charging">
          <EnergyTable logs={chargingLogs} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="fueling">
          <EnergyTable logs={fuelingLogs} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EnergyTable({ logs, isLoading }: { logs: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5" />
          Energy Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Fuel className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No energy logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-muted/30">
                    <TableCell>{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{log.cars?.plate_number}</p>
                        <p className="text-muted-foreground">{log.cars?.model}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.log_type === "charging" ? (
                        <span className="flex items-center gap-1 text-warning">
                          <Zap className="w-4 h-4" /> Charging
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary">
                          <Droplet className="w-4 h-4" /> Fueling
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {log.location || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {Number(log.amount).toFixed(2)} {log.log_type === "charging" ? "kWh" : "gal"}
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      ${Number(log.cost).toFixed(2)}
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
