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
import { useToast } from "@/hooks/use-toast";
import { Plus, Car, Battery, Fuel, Gauge, Loader2, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type CarType = "electric" | "gas";

interface CarData {
  id: string;
  plate_number: string;
  model: string;
  year: number;
  car_type: CarType;
  mileage: number;
}

export default function Cars() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [carType, setCarType] = useState<CarType>("gas");
  const [mileage, setMileage] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cars, isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addCar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cars").insert({
        plate_number: plateNumber,
        model,
        year,
        car_type: carType,
        mileage,
        current_charge_percent: carType === "electric" ? 100 : null,
        battery_health: carType === "electric" ? 100 : null,
        fuel_level: carType === "gas" ? 100 : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({ title: "Vehicle added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCar = useMutation({
    mutationFn: async () => {
      if (!editingCar) return;
      const { error } = await supabase.from("cars").update({
        plate_number: plateNumber,
        model,
        year,
        car_type: carType,
        mileage,
      }).eq("id", editingCar.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({ title: "Vehicle updated successfully" });
      setEditOpen(false);
      setEditingCar(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({ title: "Vehicle deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setPlateNumber("");
    setModel("");
    setYear(new Date().getFullYear());
    setCarType("gas");
    setMileage(0);
  };

  const openEditDialog = (car: CarData) => {
    setEditingCar(car);
    setPlateNumber(car.plate_number);
    setModel(car.model);
    setYear(car.year);
    setCarType(car.car_type);
    setMileage(car.mileage);
    setEditOpen(true);
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Car List</h1>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addCar.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plate Number</Label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="ABC-1234"
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Toyota Camry"
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={carType} onValueChange={(v) => setCarType(v as CarType)}>
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Current Mileage</Label>
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    min={0}
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addCar.isPending}>
                {addCar.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Vehicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingCar(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateCar.mutate(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="ABC-1234"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Toyota Camry"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={carType} onValueChange={(v) => setCarType(v as CarType)}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Current Mileage</Label>
                <Input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  min={0}
                  className="bg-muted"
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={updateCar.isPending}>
              {updateCar.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Vehicle
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Fleet Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : cars?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No vehicles in your fleet yet</p>
              <p className="text-sm">Add your first vehicle to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead>Plate</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Energy/Fuel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars?.map((car) => (
                    <TableRow key={car.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium">{car.plate_number}</TableCell>
                      <TableCell>{car.model}</TableCell>
                      <TableCell>{car.year}</TableCell>
                      <TableCell>
                        <StatusBadge variant={car.car_type === "electric" ? "charging" : "idle"}>
                          {car.car_type === "electric" ? (
                            <><Battery className="w-3 h-3" /> Electric</>
                          ) : (
                            <><Fuel className="w-3 h-3" /> Gas</>
                          )}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={car.health_score || 0} 
                            className="w-16 h-2"
                          />
                          <span className={`text-sm font-medium ${getHealthColor(car.health_score || 0)}`}>
                            {car.health_score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-muted-foreground" />
                          {car.car_type === "electric" ? (
                            <span>{car.current_charge_percent || 0}%</span>
                          ) : (
                            <span>{car.fuel_level || 0}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          variant={car.status === 'idle' ? 'available' : car.status === 'on_highway' ? 'highway' : 'busy'}
                        >
                          {car.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(car as CarData)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {car.plate_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCar.mutate(car.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}