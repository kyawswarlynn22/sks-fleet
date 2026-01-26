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
import { CalendarIcon, MapPin, Clock, Car, Phone, ChevronRight, CheckCircle2, Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import shweLeoLogo from "@/assets/shwe-leo-logo.png";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Landing() {
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["public-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["public-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const createPreorder = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !selectedRoute || !customerName || !customerPhone || !customerAddress || !paymentProofUrl) {
        throw new Error("Please fill all required fields");
      }

      const { error } = await supabase.from("preorders").insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        route_id: selectedRoute,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
        notes: notes.trim() || null,
        status: "pending",
        payment_proof_url: paymentProofUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedRoute("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
      setStep(1);
      setPaymentProofFile(null);
      setPaymentProofUrl(null);
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

  const selectedRouteData = routes.find((r) => String(r.id) === selectedRoute);
  const depositAmount = selectedRouteData ? Math.round(Number(selectedRouteData.base_price) * 0.3) : 0;

  const canProceedToStep2 = customerName && customerPhone && customerAddress && selectedRoute && selectedDate && selectedTime;
  const canSubmit = paymentProofUrl !== null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setPaymentProofFile(file);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      setPaymentProofUrl(publicUrl);
      toast({
        title: t("booking.uploadSuccess"),
        description: file.name,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setPaymentProofFile(null);
    } finally {
      setIsUploading(false);
    }
  };

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
              <Button variant="outline" size="sm">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 lg:py-36">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}>
                {t("hero.bookNow")}
              </Button>
              <Button size="lg" variant="outline" className="px-8" onClick={() => document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" })}>
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
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs">1</span>
                  {t("booking.step1")}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs">2</span>
                  {t("booking.step2")}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step === 2) {
                    createPreorder.mutate();
                  }
                }}
                className="space-y-6"
              >
                {step === 1 && (
                  <>
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
                      <Label htmlFor="address">{t("booking.address")} *</Label>
                      <Input
                        id="address"
                        placeholder={t("booking.addressPlaceholder")}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="route">{t("booking.selectRoute")} *</Label>
                      <Select value={selectedRoute} onValueChange={setSelectedRoute} required>
                        <SelectTrigger>
                          <SelectValue placeholder={t("booking.chooseRoute")} />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem key={String(route.id)} value={String(route.id)}>
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
                      type="button"
                      className="w-full"
                      size="lg"
                      disabled={!canProceedToStep2}
                      onClick={() => setStep(2)}
                    >
                      {t("booking.next")}
                    </Button>
                  </>
                )}

                {step === 2 && selectedRouteData && (
                  <>
                    {/* Deposit Summary */}
                    <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                      <h3 className="text-xl font-semibold text-foreground text-center">
                        {t("booking.depositTitle")}
                      </h3>
                      <p className="text-muted-foreground text-center text-sm">
                        {t("booking.depositDescription")}
                      </p>
                      
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{t("booking.routePrice")}</span>
                          <span className="text-foreground font-medium">
                            {Number(selectedRouteData.base_price).toLocaleString()} MMK
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-primary font-semibold">{t("booking.depositAmount")}</span>
                          <span className="text-primary font-bold text-2xl">
                            {depositAmount.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" />
                        {t("booking.paymentInfo")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t("booking.paymentInstructions")}
                      </p>
                      
                      <div className="space-y-3">
                        {paymentMethods.length > 0 ? (
                          paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center overflow-hidden">
                                  {method.qr_code_url ? (
                                    <img src={method.qr_code_url} alt={method.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-primary font-bold text-xs">{method.name.substring(0, 3).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{method.name}</p>
                                  <p className="text-sm text-muted-foreground">{method.account_name}</p>
                                  <p className="text-sm font-mono text-primary">{method.account_number}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            {t("booking.noPaymentMethods")}
                          </p>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {t("booking.afterPayment")}
                      </p>
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">{t("booking.uploadScreenshot")} *</Label>
                      <label
                        htmlFor="payment-proof"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                          paymentProofUrl 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">{t("booking.uploading")}</span>
                          </div>
                        ) : paymentProofUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                              <img 
                                src={paymentProofUrl} 
                                alt="Payment proof" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">{t("booking.uploadSuccess")}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{paymentProofFile?.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t("booking.uploadHint")}</span>
                          </div>
                        )}
                        <input
                          id="payment-proof"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={() => setStep(1)}
                      >
                        {t("booking.back")}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        size="lg"
                        disabled={createPreorder.isPending || !canSubmit}
                      >
                        {createPreorder.isPending ? t("booking.submitting") : t("booking.submit")}
                      </Button>
                    </div>
                  </>
                )}
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
