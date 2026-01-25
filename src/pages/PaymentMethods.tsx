import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, Wallet, QrCode, Upload } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethods() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const addMethod = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("payment_methods").insert({
        name,
        account_name: accountName,
        account_number: accountNumber,
        qr_code_url: qrCodeUrl || null,
        is_active: isActive,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method added successfully");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateMethod = useMutation({
    mutationFn: async () => {
      if (!editingMethod) return;
      const { error } = await supabase.from("payment_methods").update({
        name,
        account_name: accountName,
        account_number: accountNumber,
        qr_code_url: qrCodeUrl || null,
        is_active: isActive,
      }).eq("id", editingMethod.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method updated successfully");
      setEditOpen(false);
      setEditingMethod(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Status updated");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleQrUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      setQrCodeUrl(urlData.publicUrl);
      toast.success("QR code uploaded");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAccountName("");
    setAccountNumber("");
    setQrCodeUrl("");
    setIsActive(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setName(method.name);
    setAccountName(method.account_name);
    setAccountNumber(method.account_number);
    setQrCodeUrl(method.qr_code_url || "");
    setIsActive(method.is_active);
    setEditOpen(true);
  };

  const renderForm = (onSubmit: () => void, isPending: boolean, buttonText: string) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Wallet Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., KBZPay, WavePay"
          required
          className="bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Account holder name"
          required
          className="bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label>Account Number / Phone</Label>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="09xxxxxxxxx"
          required
          className="bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label>QR Code (Optional)</Label>
        <div className="flex gap-2">
          <Input
            value={qrCodeUrl}
            onChange={(e) => setQrCodeUrl(e.target.value)}
            placeholder="QR code URL or upload"
            className="bg-muted flex-1"
          />
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQrUpload(file);
              }}
            />
            <Button type="button" variant="outline" size="icon" disabled={isUploading} asChild>
              <span>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </span>
            </Button>
          </label>
        </div>
        {qrCodeUrl && (
          <div className="mt-2 p-2 bg-muted rounded-lg">
            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain mx-auto" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {buttonText}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">Manage mobile wallet payment options for bookings</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            {renderForm(() => addMethod.mutate(), addMethod.isPending, "Add Payment Method")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingMethod(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          {renderForm(() => updateMethod.mutate(), updateMethod.isPending, "Update Payment Method")}
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paymentMethods?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment methods configured</p>
              <p className="text-sm">Add a payment method to display in the booking form</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead>Wallet</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods?.map((method) => (
                    <TableRow key={method.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-primary" />
                          <span className="font-medium">{method.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{method.account_name}</TableCell>
                      <TableCell className="font-mono">{method.account_number}</TableCell>
                      <TableCell>
                        {method.qr_code_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(method.qr_code_url!, '_blank')}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: method.id, isActive: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(method)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{method.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMethod.mutate(method.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
