import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle2, Pause, Play, Smartphone, Globe } from "lucide-react";
import shweLeoLogo from "@/assets/shwe-leo-logo.png";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";

export default function DriverLocation() {
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [sendingLocation, setSendingLocation] = useState(false);

  // Fetch active trips for this driver
  const { data: activeTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["driver-active-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          id,
          status,
          car_id,
          cars(plate_number, model),
          routes(name, origin, destination)
        `)
        .neq("status", "completed")
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const sendLocation = useCallback(
    async (location: { coords: { latitude: number; longitude: number; accuracy: number; speed: number | null; heading: number | null } }) => {
      if (!selectedTrip || sendingLocation) return;

      const trip = activeTrips.find((t) => String(t.id) === selectedTrip);
      if (!trip) return;

      setSendingLocation(true);

      try {
        const { error } = await supabase.from("vehicle_locations").insert({
          trip_id: trip.id,
          car_id: (trip as any).car_id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading || 0,
          speed: location.coords.speed ? location.coords.speed * 3.6 : 0, // Convert m/s to km/h
          accuracy: location.coords.accuracy,
          recorded_at: new Date().toISOString(),
        });

        if (error) throw error;
      } catch (err: any) {
        console.error("Error sending location:", err);
      } finally {
        setSendingLocation(false);
      }
    },
    [selectedTrip, activeTrips, sendingLocation]
  );

  const {
    isTracking,
    isNative,
    isReady,
    lastLocation,
    error: locationError,
    startTracking,
    stopTracking,
  } = useBackgroundLocation({
    onLocation: sendLocation,
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleStartTracking = useCallback(() => {
    if (!selectedTrip) {
      toast.error("Please select a trip first");
      return;
    }
    startTracking();
    toast.success(isNative ? "Background location tracking started" : "Location tracking started");
  }, [selectedTrip, startTracking, isNative]);

  const handleStopTracking = useCallback(() => {
    stopTracking();
    toast.info("Location tracking stopped");
  }, [stopTracking]);

  const selectedTripData = activeTrips.find((t) => String(t.id) === selectedTrip);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <img src={shweLeoLogo} alt="Shwe Leo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Driver Location</h1>
          <p className="text-muted-foreground text-sm">Share your live location with dispatch</p>
          
          {/* Platform indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant={isNative ? "default" : "secondary"} className="gap-1">
              {isNative ? (
                <>
                  <Smartphone className="w-3 h-3" />
                  Native App - Background Enabled
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  Web Browser - Keep app open
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Background tracking info for native */}
        {isNative && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Background Location Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Location tracking will continue even when you close the app or turn off the screen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Web browser warning */}
        {!isNative && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Browser Limitation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep this browser tab open and screen on. For background tracking, install the native app.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Active Trip</CardTitle>
            <CardDescription>Choose the trip you're currently driving</CardDescription>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : activeTrips.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active trips assigned</p>
              </div>
            ) : (
              <Select
                value={selectedTrip}
                onValueChange={setSelectedTrip}
                disabled={isTracking}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a trip..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTrips.map((trip) => (
                    <SelectItem key={String(trip.id)} value={String(trip.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {trip.cars?.plate_number || "Unknown Vehicle"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {trip.routes?.origin} → {trip.routes?.destination}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Location Status */}
        {selectedTrip && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Location Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicator */}
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  isTracking
                    ? "bg-success/10 border border-success/30"
                    : "bg-muted border border-border"
                }`}
              >
                {isTracking ? (
                  <>
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <div>
                      <p className="font-medium text-success">Tracking Active</p>
                      <p className="text-xs text-muted-foreground">
                        {isNative 
                          ? "Background tracking enabled - close app anytime"
                          : "Sharing location - keep browser open"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-muted-foreground rounded-full" />
                    <div>
                      <p className="font-medium">Tracking Paused</p>
                      <p className="text-xs text-muted-foreground">
                        Press Start to share your location
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Error Message */}
              {locationError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{locationError}</p>
                </div>
              )}

              {/* Last Position */}
              {lastLocation && (
                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="font-medium">Last Update</span>
                  </div>
                  <p className="text-muted-foreground">
                    Lat: {lastLocation.coords.latitude.toFixed(6)}, Lng:{" "}
                    {lastLocation.coords.longitude.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground">
                    Accuracy: ±{lastLocation.coords.accuracy.toFixed(0)}m
                  </p>
                </div>
              )}

              {/* Control Button */}
              <Button
                className="w-full"
                size="lg"
                variant={isTracking ? "destructive" : "default"}
                onClick={isTracking ? handleStopTracking : handleStartTracking}
                disabled={!selectedTrip || !isReady || sendingLocation}
              >
                {!isReady ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : sendingLocation ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : isTracking ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {!isReady 
                  ? "Initializing..." 
                  : isTracking 
                    ? "Stop Tracking" 
                    : "Start Tracking"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Selected Trip Info */}
        {selectedTripData && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedTripData.cars?.plate_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTripData.routes?.origin} → {selectedTripData.routes?.destination}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
