import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DollarSign, Activity, Fuel, Wrench, Car, Users, MapPin, TrendingUp, RefreshCw, Database, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
type SyncResult = {
  synced: number;
  error?: string;
};

type SyncResponse = {
  success: boolean;
  message: string;
  results: Record<string, SyncResult>;
};

export default function Dashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResponse | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("sync-to-external");

      if (error) {
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSyncResults(data as SyncResponse);
      setSyncDialogOpen(true);

      const totalSynced = Object.values(data.results as Record<string, SyncResult>).reduce(
        (sum, r) => sum + r.synced,
        0
      );
      const hasErrors = Object.values(data.results as Record<string, SyncResult>).some((r) => r.error);

      toast({
        title: hasErrors ? "Sync Completed with Errors" : "Sync Successful",
        description: `${totalSynced} records synced to external database`,
        variant: hasErrors ? "destructive" : "default",
      });
    } catch (err) {
      toast({
        title: "Sync Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: ledger } = useQuery({
    queryKey: ["ledger"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ledger").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = ledger?.filter(e => e.entry_type === 'income').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const fuelCosts = ledger?.filter(e => e.category === 'fuel' || e.category === 'charging').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const activeTrips = trips?.filter(t => t.status !== 'completed' && t.status !== 'idle').length || 0;
  const vehiclesNeedingService = cars?.filter(c => (c.health_score || 0) < 50).length || 0;

  const recentTrips = trips?.slice(0, 5) || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'idle': return 'idle';
      case 'heading_to_pickup': return 'pickup';
      case 'on_highway': return 'highway';
      case 'rest_stop': return 'rest';
      case 'completed': return 'available';
      default: return 'idle';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your highway fleet operations</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync to External DB"}
        </Button>
      </div>

      {/* Sync Results Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Results
            </DialogTitle>
            <DialogDescription>
              Data synchronization to external database completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {syncResults?.results &&
              Object.entries(syncResults.results).map(([table, result]) => (
                <div
                  key={table}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    {result.error ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-medium capitalize">{table.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-right">
                    {result.error ? (
                      <span className="text-xs text-destructive">{result.error}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {result.synced} records
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="This month"
          icon={DollarSign}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Active Trips"
          value={activeTrips}
          subtitle="Currently on the road"
          icon={Activity}
          variant="primary"
        />
        <KPICard
          title="Fuel/Energy Costs"
          value={`$${fuelCosts.toLocaleString()}`}
          subtitle="This month"
          icon={Fuel}
          variant="warning"
        />
        <KPICard
          title="Needs Service"
          value={vehiclesNeedingService}
          subtitle="Vehicles below 50% health"
          icon={Wrench}
          variant="danger"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fleet Size</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cars?.length || 0}</div>
            <div className="flex gap-2 mt-2">
              <StatusBadge variant="available">
                {cars?.filter(c => c.car_type === 'electric').length || 0} Electric
              </StatusBadge>
              <StatusBadge variant="idle">
                {cars?.filter(c => c.car_type === 'gas').length || 0} Gas
              </StatusBadge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers?.length || 0}</div>
            <div className="flex gap-2 mt-2">
              <StatusBadge variant="available">
                {drivers?.filter(d => d.status === 'available').length || 0} Available
              </StatusBadge>
              <StatusBadge variant="busy">
                {drivers?.filter(d => d.status === 'busy').length || 0} Busy
              </StatusBadge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trips?.filter(t => t.status === 'completed').length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">Trips completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Trip Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent trips</p>
              <p className="text-sm">Trips will appear here once they're created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Trip #{trip.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Started {new Date(trip.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge variant={getStatusVariant(trip.status)} pulse={trip.status !== 'completed'}>
                    {formatStatus(trip.status)}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
