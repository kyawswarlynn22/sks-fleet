import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Activity, Car, User, MapPin, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LiveTrips() {
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
    refetchInterval: 10000, // Refresh every 10 seconds
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'heading_to_pickup': return '🚗';
      case 'on_highway': return '🛣️';
      case 'rest_stop': return '☕';
      default: return '⏸️';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Trip Monitor</h1>
        <p className="text-muted-foreground">Real-time tracking of active vehicles</p>
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
