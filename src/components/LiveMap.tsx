import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

interface VehicleLocation {
  id: string;
  trip_id: string;
  car_id: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  recorded_at: string;
  cars?: { plate_number: string; model: string };
  drivers?: { name: string };
}

interface LiveMapProps {
  className?: string;
}

export function LiveMap({ className }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapToken(data.token);
      } catch (err: any) {
        setError("Failed to load map configuration");
        console.error("Mapbox token error:", err);
      }
    };
    fetchToken();
  }, []);

  // Fetch latest locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Get latest location for each active trip
        const { data: trips, error: tripsError } = await supabase
          .from("trips")
          .select("id, car_id")
          .neq("status", "completed");

        if (tripsError) throw tripsError;

        if (!trips || trips.length === 0) {
          setLocations([]);
          setLoading(false);
          return;
        }

        const tripIds = trips.map((t) => t.id);

        // Get latest location for each trip
        const { data: locData, error: locError } = await supabase
          .from("vehicle_locations")
          .select(`
            *,
            cars(plate_number, model),
            drivers(name)
          `)
          .in("trip_id", tripIds)
          .order("recorded_at", { ascending: false });

        if (locError) throw locError;

        // Deduplicate to get only the latest per trip
        const latestByTrip = new Map<string, VehicleLocation>();
        (locData || []).forEach((loc) => {
          const tripId = String(loc.trip_id);
          if (!latestByTrip.has(tripId)) {
            latestByTrip.set(tripId, loc as VehicleLocation);
          }
        });

        setLocations(Array.from(latestByTrip.values()));
      } catch (err: any) {
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("vehicle_locations_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vehicle_locations",
        },
        (payload) => {
          const newLoc = payload.new as VehicleLocation;
          setLocations((prev) => {
            const updated = prev.filter((l) => l.trip_id !== newLoc.trip_id);
            return [newLoc, ...updated];
          });
        }
      )
      .subscribe();

    // Refresh every 10 seconds
    const interval = setInterval(fetchLocations, 10000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [96.1951, 16.8661], // Myanmar (Yangon) center
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers that are no longer in locations
    const currentTripIds = new Set(locations.map((l) => l.trip_id));
    markers.current.forEach((marker, tripId) => {
      if (!currentTripIds.has(tripId)) {
        marker.remove();
        markers.current.delete(tripId);
      }
    });

    // Add or update markers
    locations.forEach((loc) => {
      const existing = markers.current.get(loc.trip_id);

      if (existing) {
        existing.setLngLat([Number(loc.longitude), Number(loc.latitude)]);
      } else {
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "vehicle-marker";
        el.innerHTML = `
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([Number(loc.longitude), Number(loc.latitude)])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <p class="font-bold">${loc.cars?.plate_number || "Vehicle"}</p>
                <p class="text-sm text-gray-600">${loc.cars?.model || ""}</p>
                ${loc.drivers ? `<p class="text-sm">Driver: ${loc.drivers.name}</p>` : ""}
                <p class="text-xs text-gray-500 mt-1">Speed: ${Number(loc.speed).toFixed(0)} km/h</p>
              </div>
            `)
          )
          .addTo(map.current!);

        markers.current.set(loc.trip_id, marker);
      }
    });

    // Fit bounds to show all markers
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach((loc) => {
        bounds.extend([Number(loc.longitude), Number(loc.latitude)]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [locations]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Live Vehicle Tracking
          {locations.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {locations.length} active vehicle{locations.length !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] rounded-b-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
          {!loading && locations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active vehicles sharing location</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
