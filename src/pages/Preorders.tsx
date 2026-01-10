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
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, User, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Preorders() {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [routeId, setRouteId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preorders, isLoading } = useQuery({
    queryKey: ["preorders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preorders")
        .select(`
          *,
          routes(name, origin, destination),
          drivers(name),
          cars(plate_number, model)
        `)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").eq("status", "available");
      if (error) throw error;
      return data;
    },
  });

  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").eq("status", "idle");
      if (error) throw error;
      return data;
    },
  });

  const addPreorder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("preorders").insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        route_id: routeId || null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast({ title: "Pre-order created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignDriver = useMutation({
    mutationFn: async ({ preorderId, driverId, carId }: { preorderId: string; driverId: string; carId: string }) => {
      const { error } = await supabase
        .from("preorders")
        .update({ 
          assigned_driver_id: driverId, 
          assigned_car_id: carId,
          status: "assigned" 
        })
        .eq("id", preorderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast({ title: "Driver assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setRouteId("");
    setScheduledDate("");
    setScheduledTime("");
    setNotes("");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'charging';
      case 'assigned': return 'available';
      case 'completed': return 'idle';
      case 'cancelled': return 'busy';
      default: return 'idle';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-orders</h1>
          <p className="text-muted-foreground">Manage scheduled trips and driver assignments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              New Pre-order
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Pre-order</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addPreorder.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes?.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.origin} → {route.destination})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements..."
                  className="bg-muted"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addPreorder.isPending}>
                {addPreorder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Pre-order
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : preorders?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pre-orders yet</p>
              <p className="text-sm">Create your first scheduled trip</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preorders?.map((preorder) => (
                    <TableRow key={preorder.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{preorder.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{preorder.customer_phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {preorder.routes ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-success" />
                            {preorder.routes.origin}
                            <span className="text-muted-foreground">→</span>
                            <MapPin className="w-3 h-3 text-destructive" />
                            {preorder.routes.destination}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(preorder.scheduled_date), "MMM d, yyyy")}</p>
                          <p className="text-muted-foreground">{preorder.scheduled_time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {preorder.drivers ? (
                          <div className="text-sm">
                            <p>{preorder.drivers.name}</p>
                            <p className="text-muted-foreground">{preorder.cars?.plate_number}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={getStatusVariant(preorder.status)}>
                          {preorder.status.replace(/\b\w/g, l => l.toUpperCase())}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {preorder.status === 'pending' && drivers && drivers.length > 0 && cars && cars.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignDriver.mutate({ 
                              preorderId: preorder.id, 
                              driverId: drivers[0].id,
                              carId: cars[0].id
                            })}
                            disabled={assignDriver.isPending}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
