import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Car, User, MapPin, Clock, Loader2, Check, Calendar, DollarSign } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type TripStatus = Database["public"]["Enums"]["trip_status"];

const TRIP_STATUSES: { value: TripStatus; label: string; icon: string }[] = [
  { value: "idle", label: "Idle", icon: "⏸️" },
  { value: "heading_to_pickup", label: "Heading to Pickup", icon: "🚗" },
  { value: "on_highway", label: "On Highway", icon: "🛣️" },
  { value: "rest_stop", label: "Rest Stop", icon: "☕" },
  { value: "completed", label: "Completed", icon: "✅" },
];

export default function LiveTrips() {
  const queryClient = useQueryClient();
  const [fareInputs, setFareInputs] = useState<Record<string, string>>({});

  const { data: trips, isLoading } = useQuery({
    queryKey: ["live-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          cars(plate_number, model, car_type),
          drivers(name),
          routes(name, origin, destination),
          preorders(customer_name, customer_phone, scheduled_date, scheduled_time)
        `)
        .neq("status", "completed")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ tripId, status, preorderId, carId, driverId, totalFare }: { 
      tripId: string | number; 
      status: TripStatus; 
      preorderId?: string | number | null;
      carId: string | number;
      driverId?: string | number | null;
      totalFare?: number | null;
    }) => {
      const updateData: { status: TripStatus; completed_at?: string } = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("trips")
        .update(updateData)
        .eq("id", tripId as any);
      
      if (error) throw error;

      // If trip is completed, update preorder status and add to ledger
      if (status === "completed") {
        // Update preorder if linked
        if (preorderId) {
          await supabase
            .from("preorders")
            .update({ status: "completed" })
            .eq("id", preorderId as any);
        }

        // Add income entry to ledger
        if (totalFare && totalFare > 0) {
          const { error: ledgerError } = await supabase
            .from("ledger")
            .insert({
              entry_type: "income",
              amount: totalFare,
              description: `Trip completed - #${String(tripId).slice(0, 8)}`,
              car_id: carId as any,
              driver_id: driverId as any,
              trip_id: tripId as any,
            });
          
          if (ledgerError) {
            console.error("Failed to add ledger entry:", ledgerError);
          }
        }

        // Update car status to idle
        await supabase
          .from("cars")
          .update({ status: "idle" })
          .eq("id", carId as any);
        
        // Update driver status back to available
        if (driverId) {
          await supabase
            .from("drivers")
            .update({ status: "available" })
            .eq("id", driverId as any);
        }
      } else {
        await supabase
          .from("cars")
          .update({ status })
          .eq("id", carId as any);
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["live-trips"] });
      queryClient.invalidateQueries({ queryKey: ["preorders"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["available-cars"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success(`Trip status updated to ${status.replace(/_/g, " ")}`);
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const updateFareMutation = useMutation({
    mutationFn: async ({ tripId, fare }: { tripId: string | number; fare: number }) => {
      const { error } = await supabase
        .from("trips")
        .update({ total_fare: fare })
        .eq("id", tripId as any);
      
      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ["live-trips"] });
      setFareInputs(prev => {
        const updated = { ...prev };
        delete updated[String(tripId)];
        return updated;
      });
      toast.success("Fare updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update fare: " + error.message);
    },
  });

  const handleFareChange = (tripId: string | number, value: string) => {
    setFareInputs(prev => ({ ...prev, [String(tripId)]: value }));
  };

  const handleFareSave = (tripId: string | number, currentFare: number | null) => {
    const inputValue = fareInputs[String(tripId)];
    const newFare = inputValue !== undefined ? parseFloat(inputValue) : currentFare;
    
    if (newFare === null || isNaN(newFare) || newFare < 0) {
      toast.error("Please enter a valid fare amount");
      return;
    }
    
    updateFareMutation.mutate({ tripId, fare: newFare });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'idle': return 'idle';
      case 'heading_to_pickup': return 'pickup';
      case 'on_highway': return 'highway';
      case 'rest_stop': return 'rest';
      default: return 'idle';
    }
  };

  const getStatusIcon = (status: string) => {
    return TRIP_STATUSES.find(s => s.value === status)?.icon || "⏸️";
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Trip Monitor</h1>
        <p className="text-muted-foreground">Real-time tracking of active vehicles • Click status to update</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : trips?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active trips at the moment</p>
              <p className="text-sm">Trips will appear here when vehicles are on the road</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips?.map((trip) => (
            <Card 
              key={String(trip.id)} 
              className="bg-card border-border overflow-hidden hover:shadow-elevated transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <span className="text-2xl">{getStatusIcon(trip.status)}</span>
                    Trip #{String(trip.id).slice(0, 8)}
                  </CardTitle>
                  <StatusBadge 
                    variant={getStatusVariant(trip.status)} 
                    pulse={trip.status === 'on_highway'}
                  >
                    {formatStatus(trip.status)}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preorder Info - if linked */}
                {trip.preorders && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-xs text-primary mb-1">
                      <Calendar className="w-3 h-3" />
                      Pre-order Trip
                    </div>
                    <p className="font-medium text-sm">{trip.preorders.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.preorders.customer_phone}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: {format(new Date(trip.preorders.scheduled_date), "MMM d")} at {trip.preorders.scheduled_time}
                    </p>
                  </div>
                )}

                {/* Status Update Selector */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <label className="text-xs text-muted-foreground mb-2 block">Update Status</label>
                  <Select
                    value={trip.status}
                    onValueChange={(value: TripStatus) => 
                      updateStatusMutation.mutate({ 
                        tripId: trip.id, 
                        status: value,
                        preorderId: trip.preorder_id,
                        carId: trip.car_id,
                        driverId: trip.driver_id,
                        totalFare: trip.total_fare ? Number(trip.total_fare) : null,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIP_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <span className="flex items-center gap-2">
                            <span>{status.icon}</span>
                            <span>{status.label}</span>
                            {trip.status === status.value && (
                              <Check className="w-4 h-4 text-success ml-auto" />
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fare Input */}
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Trip Fare
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter fare..."
                      value={fareInputs[String(trip.id)] ?? (trip.total_fare ? String(trip.total_fare) : "")}
                      onChange={(e) => handleFareChange(trip.id, e.target.value)}
                      className="flex-1 bg-background"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFareSave(trip.id, trip.total_fare ? Number(trip.total_fare) : null)}
                      disabled={updateFareMutation.isPending}
                      className="border-success/30 text-success hover:bg-success/10"
                    >
                      {updateFareMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {trip.total_fare && (
                    <p className="text-xs text-success mt-1">
                      Current: ${Number(trip.total_fare).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{trip.cars?.plate_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.cars?.model} • {trip.cars?.car_type === 'electric' ? '⚡ Electric' : '⛽ Gas'}
                    </p>
                  </div>
                </div>

                {/* Driver Info */}
                {trip.drivers && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{trip.drivers.name}</span>
                  </div>
                )}

                {/* Route Info */}
                {trip.routes && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-success" />
                    <span>{trip.routes.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <MapPin className="w-4 h-4 text-destructive" />
                    <span>{trip.routes.destination}</span>
                  </div>
                )}

                {/* Time Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="w-3 h-3" />
                  Started {formatDistanceToNow(new Date(trip.started_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}