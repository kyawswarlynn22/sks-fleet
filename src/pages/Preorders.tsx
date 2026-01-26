import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { Plus, Calendar, User, MapPin, Loader2, Play, XCircle, Pencil, Trash2, ImageIcon, Receipt } from "lucide-react";
import { format } from "date-fns";
import { toStringId } from "@/lib/id-utils";

const PREORDER_STATUSES = [
  { value: "pending", label: "Pending", icon: "⏳" },
  { value: "assigned", label: "Assigned", icon: "👤" },
  { value: "in_progress", label: "In Progress", icon: "🚗" },
  { value: "completed", label: "Completed", icon: "✅" },
  { value: "cancelled", label: "Cancelled", icon: "❌" },
];

interface PreorderData {
  id: string | number;
  customer_name: string;
  customer_phone: string | null;
  route_id: string | number | null;
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
}

export default function Preorders() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPreorder, setEditingPreorder] = useState<PreorderData | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPreorder, setSelectedPreorder] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedCar, setSelectedCar] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [routeId, setRouteId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentProofDialogOpen, setPaymentProofDialogOpen] = useState(false);
  const [viewingPaymentProof, setViewingPaymentProof] = useState<{ url: string; customerName: string } | null>(null);
  
  const queryClient = useQueryClient();

  const { data: preorders, isLoading } = useQuery({
    queryKey: ["preorders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preorders")
        .select(`
          *,
          routes(id, name, origin, destination, base_price),
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
    queryKey: ["available-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").eq("status", "available");
      if (error) throw error;
      return data;
    },
  });

  const { data: cars } = useQuery({
    queryKey: ["available-cars"],
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
      toast.success("Pre-order created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const updatePreorder = useMutation({
    mutationFn: async () => {
      if (!editingPreorder) return;
      const { error } = await supabase.from("preorders").update({
        customer_name: customerName,
        customer_phone: customerPhone,
        route_id: routeId || null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        notes,
      }).eq("id", editingPreorder.id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast.success("Pre-order updated successfully");
      setEditOpen(false);
      setEditingPreorder(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const deletePreorder = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from("preorders").delete().eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast.success("Pre-order deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const assignDriver = useMutation({
    mutationFn: async ({ preorderId, driverId, carId }: { preorderId: string | number; driverId: string | number; carId: string | number }) => {
      const { error } = await supabase
        .from("preorders")
        .update({ 
          assigned_driver_id: driverId as any, 
          assigned_car_id: carId as any,
          status: "assigned" 
        })
        .eq("id", preorderId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast.success("Driver and car assigned successfully");
      setAssignDialogOpen(false);
      setSelectedPreorder(null);
      setSelectedDriver("");
      setSelectedCar("");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ preorderId, status }: { preorderId: string | number; status: string }) => {
      const { error } = await supabase
        .from("preorders")
        .update({ status })
        .eq("id", preorderId as any);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const startTrip = useMutation({
    mutationFn: async (preorder: any) => {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          car_id: preorder.assigned_car_id as any,
          driver_id: preorder.assigned_driver_id as any,
          route_id: preorder.route_id as any,
          preorder_id: preorder.id as any,
          status: "heading_to_pickup",
          total_fare: preorder.routes?.base_price || null,
        })
        .select()
        .single();
      
      if (tripError) throw tripError;

      const { error: preorderError } = await supabase
        .from("preorders")
        .update({ status: "in_progress" })
        .eq("id", preorder.id as any);
      
      if (preorderError) throw preorderError;

      const { error: carError } = await supabase
        .from("cars")
        .update({ status: "heading_to_pickup" })
        .eq("id", preorder.assigned_car_id as any);
      
      if (carError) throw carError;

      const { error: driverError } = await supabase
        .from("drivers")
        .update({ status: "busy" })
        .eq("id", preorder.assigned_driver_id as any);
      
      if (driverError) throw driverError;

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      queryClient.invalidateQueries({ queryKey: ["live-trips"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["available-cars"] });
      toast.success("Trip started! Check Live Trips to monitor.");
    },
    onError: (error: any) => {
      toast.error("Error starting trip: " + error.message);
    },
  });

  const cancelPreorder = useMutation({
    mutationFn: async (preorderId: string) => {
      const { error } = await supabase
        .from("preorders")
        .update({ status: "cancelled" })
        .eq("id", preorderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      toast.success("Pre-order cancelled");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
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

  const openEditDialog = (preorder: PreorderData) => {
    setEditingPreorder(preorder);
    setCustomerName(preorder.customer_name);
    setCustomerPhone(preorder.customer_phone || "");
    setRouteId(preorder.route_id ? toStringId(preorder.route_id) : "");
    setScheduledDate(preorder.scheduled_date);
    setScheduledTime(preorder.scheduled_time);
    setNotes(preorder.notes || "");
    setEditOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'charging';
      case 'assigned': return 'available';
      case 'in_progress': return 'highway';
      case 'completed': return 'idle';
      case 'cancelled': return 'busy';
      default: return 'idle';
    }
  };

  const openAssignDialog = (preorderId: string) => {
    setSelectedPreorder(preorderId);
    setAssignDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-orders</h1>
          <p className="text-muted-foreground">Manage scheduled trips and driver assignments</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
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
                      <SelectItem key={toStringId(route.id)} value={toStringId(route.id)}>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingPreorder(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Pre-order</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updatePreorder.mutate(); }} className="space-y-4">
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
                    <SelectItem key={toStringId(route.id)} value={toStringId(route.id)}>
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
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={updatePreorder.isPending}>
              {updatePreorder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Pre-order
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Driver/Car Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Assign Driver & Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={toStringId(driver.id)} value={toStringId(driver.id)}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              <Select value={selectedCar} onValueChange={setSelectedCar}>
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {cars?.map((car) => (
                    <SelectItem key={toStringId(car.id)} value={toStringId(car.id)}>
                      {car.plate_number} - {car.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full gradient-primary text-primary-foreground"
              disabled={!selectedDriver || !selectedCar || assignDriver.isPending}
              onClick={() => {
                if (selectedPreorder) {
                  assignDriver.mutate({ 
                    preorderId: selectedPreorder, 
                    driverId: selectedDriver, 
                    carId: selectedCar 
                  });
                }
              }}
            >
              {assignDriver.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    <TableHead>Address</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preorders?.map((preorder) => (
                    <TableRow key={toStringId(preorder.id)} className="border-border hover:bg-muted/30">
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
                        {preorder.customer_address ? (
                          <span className="text-sm">{preorder.customer_address}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
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
                        {preorder.payment_proof_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary"
                            onClick={() => {
                              setViewingPaymentProof({
                                url: preorder.payment_proof_url,
                                customerName: preorder.customer_name,
                              });
                              setPaymentProofDialogOpen(true);
                            }}
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">No proof</span>
                        )}
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
                        <Select
                          value={preorder.status || 'pending'}
                          onValueChange={(value) => updateStatus.mutate({ preorderId: preorder.id, status: value })}
                          disabled={preorder.status === 'completed' || preorder.status === 'cancelled' || preorder.status === 'in_progress'}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <StatusBadge variant={getStatusVariant(preorder.status || 'pending')}>
                              {(preorder.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </StatusBadge>
                          </SelectTrigger>
                          <SelectContent>
                            {PREORDER_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <span className="flex items-center gap-2">
                                  <span>{status.icon}</span>
                                  <span>{status.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {preorder.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAssignDialog(preorder.id)}
                                disabled={!drivers?.length || !cars?.length}
                              >
                                <User className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(preorder as PreorderData)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {preorder.status === 'assigned' && preorder.assigned_driver_id && preorder.assigned_car_id && (
                            <>
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => startTrip.mutate(preorder)}
                                disabled={startTrip.isPending}
                              >
                                {startTrip.isPending ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3 mr-1" />
                                )}
                                Start Trip
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(preorder as PreorderData)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {preorder.status === 'in_progress' && (
                            <StatusBadge variant="highway" pulse>
                              🚗 On Trip
                            </StatusBadge>
                          )}
                          {(preorder.status === 'pending' || preorder.status === 'assigned') && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => cancelPreorder.mutate(String(preorder.id))}
                                disabled={cancelPreorder.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Pre-order</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this pre-order for {preorder.customer_name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePreorder.mutate(preorder.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Proof Dialog */}
      <Dialog open={paymentProofDialogOpen} onOpenChange={setPaymentProofDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Payment Proof - {viewingPaymentProof?.customerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewingPaymentProof?.url && (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <img 
                  src={viewingPaymentProof.url} 
                  alt="Payment proof screenshot" 
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentProofDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  if (viewingPaymentProof?.url) {
                    window.open(viewingPaymentProof.url, '_blank');
                  }
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Open Full Size
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}