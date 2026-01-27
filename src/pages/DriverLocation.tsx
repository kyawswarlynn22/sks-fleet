import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle2, Pause, Play } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import shweLeoLogo from "@/assets/shwe-leo-logo.png";

export default function DriverLocation() {
  const { role, loading: roleLoading, isDriver, isAdmin } = useUserRole();
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
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
    async (position: GeolocationPosition) => {
      if (!selectedTrip || sendingLocation) return;

      const trip = activeTrips.find((t) => String(t.id) === selectedTrip);
      if (!trip) return;

      setSendingLocation(true);

      try {
        const { error } = await supabase.from("vehicle_locations").insert({
          trip_id: trip.id,
          car_id: (trip as any).car_id || trip.id, // Fallback
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
          accuracy: position.coords.accuracy,
          recorded_at: new Date().toISOString(),
        });

        if (error) throw error;
        setLastPosition(position);
        setLocationError(null);
      } catch (err: any) {
        console.error("Error sending location:", err);
        setLocationError("Failed to send location");
      } finally {
        setSendingLocation(false);
      }
    },
    [selectedTrip, activeTrips, sendingLocation]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    if (!selectedTrip) {
      toast.error("Please select a trip first");
      return;
    }

    setLocationError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        sendLocation(position);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Please check GPS settings.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Retrying...");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success("Location tracking started");
  }, [selectedTrip, sendLocation]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.info("Location tracking stopped");
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Stop tracking if trip changes
  useEffect(() => {
    if (isTracking && selectedTrip) {
      stopTracking();
    }
  }, [selectedTrip]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDriver && !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const selectedTripData = activeTrips.find((t) => String(t.id) === selectedTrip);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <img src={shweLeoLogo} alt="Shwe Leo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Driver Location</h1>
          <p className="text-muted-foreground text-sm">Share your live location with dispatch</p>
        </div>

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
                        Sharing location every 5 seconds
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
              {lastPosition && (
                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="font-medium">Last Update</span>
                  </div>
                  <p className="text-muted-foreground">
                    Lat: {lastPosition.coords.latitude.toFixed(6)}, Lng:{" "}
                    {lastPosition.coords.longitude.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground">
                    Accuracy: ±{lastPosition.coords.accuracy.toFixed(0)}m
                  </p>
                </div>
              )}

              {/* Control Button */}
              <Button
                className="w-full"
                size="lg"
                variant={isTracking ? "destructive" : "default"}
                onClick={isTracking ? stopTracking : startTracking}
                disabled={!selectedTrip || sendingLocation}
              >
                {sendingLocation ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : isTracking ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {isTracking ? "Stop Tracking" : "Start Tracking"}
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
