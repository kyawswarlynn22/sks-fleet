import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Activity, Car, User, MapPin, Clock, Loader2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

  const { data: trips, isLoading } = useQuery({
    queryKey: ["live-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          cars(plate_number, model, car_type),
          drivers(name),
          routes(name, origin, destination)
        `)
        .neq("status", "completed")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: TripStatus }) => {
      const updateData: { status: TripStatus; completed_at?: string } = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("trips")
        .update(updateData)
        .eq("id", tripId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["live-trips"] });
      toast.success(`Trip status updated to ${status.replace(/_/g, " ")}`);
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

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
              key={trip.id} 
              className="bg-card border-border overflow-hidden hover:shadow-elevated transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <span className="text-2xl">{getStatusIcon(trip.status)}</span>
                    Trip #{trip.id.slice(0, 8)}
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
                {/* Status Update Selector */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <label className="text-xs text-muted-foreground mb-2 block">Update Status</label>
                  <Select
                    value={trip.status}
                    onValueChange={(value: TripStatus) => 
                      updateStatusMutation.mutate({ tripId: trip.id, status: value })
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