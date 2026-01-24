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
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, FileCheck, FileX, Clock, Loader2, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DriverData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export default function Drivers() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDriver = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("drivers").insert({
        name,
        phone,
        email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDriver = useMutation({
    mutationFn: async () => {
      if (!editingDriver) return;
      const { error } = await supabase.from("drivers").update({
        name,
        phone,
        email,
      }).eq("id", editingDriver.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver updated successfully" });
      setEditOpen(false);
      setEditingDriver(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDriver = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
  };

  const openEditDialog = (driver: DriverData) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone || "");
    setEmail(driver.email || "");
    setEditOpen(true);
  };

  const getFatigueLevel = (hours: number) => {
    if (hours < 4) return { label: "Fresh", variant: "available" as const, color: "text-success" };
    if (hours < 8) return { label: "Moderate", variant: "charging" as const, color: "text-warning" };
    return { label: "Fatigued", variant: "busy" as const, color: "text-destructive" };
  };

  const MAX_DRIVING_HOURS = 11;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver List</h1>
          <p className="text-muted-foreground">Manage your drivers and monitor fatigue levels</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addDriver.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-muted"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addDriver.isPending}>
                {addDriver.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Driver
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingDriver(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateDriver.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="bg-muted"
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={updateDriver.isPending}>
              {updateDriver.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Driver
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : drivers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No drivers registered yet</p>
              <p className="text-sm">Add your first driver to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Fatigue Monitor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers?.map((driver) => {
                    const fatigue = getFatigueLevel(Number(driver.hours_driven_today));
                    const hoursPercent = (Number(driver.hours_driven_today) / MAX_DRIVING_HOURS) * 100;
                    
                    return (
                      <TableRow key={driver.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{driver.phone || "—"}</p>
                            <p className="text-muted-foreground">{driver.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-sm">
                              {driver.license_uploaded ? (
                                <FileCheck className="w-4 h-4 text-success" />
                              ) : (
                                <FileX className="w-4 h-4 text-destructive" />
                              )}
                              License
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                              {driver.permit_uploaded ? (
                                <FileCheck className="w-4 h-4 text-success" />
                              ) : (
                                <FileX className="w-4 h-4 text-destructive" />
                              )}
                              Permit
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className={`text-sm font-medium ${fatigue.color}`}>
                                {Number(driver.hours_driven_today).toFixed(1)}h / {MAX_DRIVING_HOURS}h
                              </span>
                              {Number(driver.hours_driven_today) >= 8 && (
                                <AlertTriangle className="w-4 h-4 text-warning" />
                              )}
                            </div>
                            <Progress 
                              value={Math.min(hoursPercent, 100)} 
                              className="h-1.5 w-24"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            variant={driver.status === 'available' ? 'available' : 'busy'}
                            pulse={driver.status === 'busy'}
                          >
                            {driver.status?.replace(/\b\w/g, l => l.toUpperCase())}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(driver as DriverData)}
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
                                  <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {driver.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDriver.mutate(driver.id)}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}