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
import { useToast } from "@/hooks/use-toast";
import { Plus, Route, MapPin, DollarSign, Loader2, Pencil, Trash2 } from "lucide-react";
import { toStringId } from "@/lib/id-utils";

interface RouteData {
  id: string | number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  base_price: number;
  estimated_tolls: number;
}

export default function Routes() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [estimatedTolls, setEstimatedTolls] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes, isLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addRoute = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("routes").insert({
        name,
        origin,
        destination,
        distance_km: distanceKm,
        base_price: basePrice,
        estimated_tolls: estimatedTolls,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoute = useMutation({
    mutationFn: async () => {
      if (!editingRoute) return;
      const { error } = await supabase.from("routes").update({
        name,
        origin,
        destination,
        distance_km: distanceKm,
        base_price: basePrice,
        estimated_tolls: estimatedTolls,
      }).eq("id", editingRoute.id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route updated successfully" });
      setEditOpen(false);
      setEditingRoute(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoute = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from("routes").delete().eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Route deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setOrigin("");
    setDestination("");
    setDistanceKm(0);
    setBasePrice(0);
    setEstimatedTolls(0);
  };

  const openEditDialog = (route: RouteData) => {
    setEditingRoute(route);
    setName(route.name);
    setOrigin(route.origin);
    setDestination(route.destination);
    setDistanceKm(Number(route.distance_km));
    setBasePrice(Number(route.base_price));
    setEstimatedTolls(Number(route.estimated_tolls));
    setEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground">Define highway corridors and pricing</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Route</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addRoute.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Route Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Express Highway 101"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Origin City</Label>
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="New York"
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination City</Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Boston"
                    required
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Distance (km)</Label>
                <Input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  min={0}
                  required
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Base Price ($)</Label>
                  <Input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    required
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Tolls ($)</Label>
                  <Input
                    type="number"
                    value={estimatedTolls}
                    onChange={(e) => setEstimatedTolls(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={addRoute.isPending}>
                {addRoute.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Route
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingRoute(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateRoute.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Express Highway 101"
                required
                className="bg-muted"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Origin City</Label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="New York"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Destination City</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Boston"
                  required
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                min={0}
                required
                className="bg-muted"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Base Price ($)</Label>
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  min={0}
                  step="0.01"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Tolls ($)</Label>
                <Input
                  type="number"
                  value={estimatedTolls}
                  onChange={(e) => setEstimatedTolls(Number(e.target.value))}
                  min={0}
                  step="0.01"
                  className="bg-muted"
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={updateRoute.isPending}>
              {updateRoute.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Route
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Highway Corridors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : routes?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No routes defined yet</p>
              <p className="text-sm">Create your first highway route</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead>Route Name</TableHead>
                    <TableHead>Corridor</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Est. Tolls</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes?.map((route) => (
                    <TableRow key={toStringId(route.id)} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-success" />
                          <span>{route.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <MapPin className="w-4 h-4 text-destructive" />
                          <span>{route.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>{Number(route.distance_km).toLocaleString()} km</TableCell>
                      <TableCell>
                        <span className="text-success">${Number(route.base_price).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-warning">${Number(route.estimated_tolls).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="w-4 h-4 text-primary" />
                          {(Number(route.base_price) + Number(route.estimated_tolls)).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(route as RouteData)}
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
                                <AlertDialogTitle>Delete Route</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{route.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRoute.mutate(toStringId(route.id))}
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