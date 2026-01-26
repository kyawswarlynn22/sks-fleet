import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { History, CalendarIcon, Filter, X, Car, User, MapPin, DollarSign, Loader2 } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { toStringId, formatIdForDisplay } from "@/lib/id-utils";

export default function TripHistory() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");

  // Fetch completed trips
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trip-history", dateFrom, dateTo, selectedDriver, selectedRoute],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select(`
          *,
          cars(plate_number, model, car_type),
          drivers(name),
          routes(name, origin, destination, base_price)
        `)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("completed_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("completed_at", endOfDay.toISOString());
      }
      if (selectedDriver && selectedDriver !== "all") {
        query = query.eq("driver_id", selectedDriver);
      }
      if (selectedRoute && selectedRoute !== "all") {
        query = query.eq("route_id", selectedRoute);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers for filter
  const { data: drivers } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch routes for filter
  const { data: routes } = useQuery({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("id, name, origin, destination")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedDriver("all");
    setSelectedRoute("all");
  };

  const hasFilters = dateFrom || dateTo || selectedDriver !== "all" || selectedRoute !== "all";

  // Calculate stats
  const totalTrips = trips?.length || 0;
  const totalRevenue = trips?.reduce((sum, trip) => sum + (Number(trip.total_fare) || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Trip History
        </h1>
        <p className="text-muted-foreground">View all completed trips with filters</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTrips}</p>
                <p className="text-xs text-muted-foreground">Completed Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Driver Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Driver</label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers?.map((driver) => (
                    <SelectItem key={toStringId(driver.id)} value={toStringId(driver.id)}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Route</label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes?.map((route) => (
                    <SelectItem key={toStringId(route.id)} value={toStringId(route.id)}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Completed Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : trips?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completed trips found</p>
              <p className="text-sm">Adjust your filters or wait for trips to complete</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Fare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips?.map((trip) => (
                    <TableRow key={toStringId(trip.id)}>
                      <TableCell className="font-mono text-xs">
                        #{formatIdForDisplay(trip.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{trip.cars?.plate_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {trip.cars?.model}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{trip.drivers?.name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {trip.routes ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-success" />
                            <span>{trip.routes.origin}</span>
                            <span className="text-muted-foreground">→</span>
                            <MapPin className="w-3 h-3 text-destructive" />
                            <span>{trip.routes.destination}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {trip.started_at && trip.completed_at
                          ? formatDistanceStrict(
                              new Date(trip.started_at),
                              new Date(trip.completed_at)
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {trip.completed_at
                          ? format(new Date(trip.completed_at), "MMM d, yyyy h:mm a")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge variant="available">
                          ${Number(trip.total_fare || 0).toFixed(2)}
                        </StatusBadge>
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
