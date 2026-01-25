import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Clock, Car, Phone, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import shweLeoLogo from "@/assets/shwe-leo-logo.png";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Landing() {
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["public-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createPreorder = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !selectedRoute || !customerName || !customerPhone) {
        throw new Error("Please fill all required fields");
      }

      const { error } = await supabase.from("preorders").insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        route_id: selectedRoute,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
        notes: notes.trim() || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setCustomerName("");
      setCustomerPhone("");
      setSelectedRoute("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["public-routes"] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedRouteData = routes.find((r) => r.id === selectedRoute);

  const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00",
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/90 backdrop-blur border-border/50">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("success.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("success.description")}</p>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              {t("success.bookAnother")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={shweLeoLogo} alt="Shwe Leo" className="h-12 object-contain" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="outline" size="sm">{t("nav.staffLogin")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--destructive)/0.1),transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t("hero.title")} <span className="text-gradient">{t("hero.titleHighlight")}</span> {t("hero.titleEnd")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}>
                {t("hero.bookNow")} <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" })}>
                {t("hero.viewRoutes")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("features.fleet.title")}</h3>
              <p className="text-muted-foreground">{t("features.fleet.description")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("features.scheduling.title")}</h3>
              <p className="text-muted-foreground">{t("features.scheduling.description")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("features.booking.title")}</h3>
              <p className="text-muted-foreground">{t("features.booking.description")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Routes & Pricing */}
      <section id="routes" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">{t("routes.title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("routes.description")}
          </p>

          {routesLoading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : routes.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("routes.noRoutes")}</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {routes.map((route) => (
                <Card key={route.id} className="bg-card/80 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{route.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {route.origin} → {route.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold text-foreground">
                          {Number(route.base_price).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">MMK</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{route.distance_km} km</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">{t("booking.title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("booking.description")}
          </p>

          <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPreorder.mutate();
                }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("booking.name")} *</Label>
                    <Input
                      id="name"
                      placeholder={t("booking.name")}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("booking.phone")} *</Label>
                    <Input
                      id="phone"
                      placeholder={t("booking.phonePlaceholder")}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">{t("booking.selectRoute")} *</Label>
                  <Select value={selectedRoute} onValueChange={setSelectedRoute} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("booking.chooseRoute")} />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} - {route.origin} → {route.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRouteData && (
                    <p className="text-sm text-primary">
                      {t("booking.price")}: {Number(selectedRouteData.base_price).toLocaleString()} MMK
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("booking.travelDate")} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : t("booking.pickDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">{t("booking.departureTime")} *</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("booking.selectTime")} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("booking.notes")}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("booking.notesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createPreorder.isPending}
                >
                  {createPreorder.isPending ? t("booking.submitting") : t("booking.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">{t("contact.title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("contact.description")}
          </p>

          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-card/80 backdrop-blur border border-border/50">
              <Phone className="w-6 h-6 text-primary" />
              <a 
                href="tel:09950045555" 
                className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
              >
                09-950045555
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <img src={shweLeoLogo} alt="Shwe Leo" className="h-10 object-contain mx-auto mb-4" />
          <p className="text-muted-foreground text-sm mb-2">
            {t("contact.callUs")}: <a href="tel:09950045555" className="hover:text-primary transition-colors">09-950045555</a>
          </p>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Shwe Leo. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
