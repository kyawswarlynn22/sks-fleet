import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import shweLeoLogo from "@/assets/shwe-leo-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={shweLeoLogo} alt="Shwe Leo" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-2xl">Install Shwe Leo</CardTitle>
          <CardDescription>
            Install our app for a better experience with offline access and faster loading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
              </div>
              <p className="text-muted-foreground">App is already installed!</p>
              <Link to="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <span className="flex items-center gap-2">
                    Tap the Share button <Share className="w-4 h-4" />
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <span>Tap "Add" to confirm</span>
                </li>
              </ol>
            </div>
          ) : isAndroid && !deferredPrompt ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on Android:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <span className="flex items-center gap-2">
                    Tap the menu button <MoreVertical className="w-4 h-4" />
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <span>Tap "Install app" or "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <span>Tap "Install" to confirm</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
              </div>
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Open this page in Chrome, Safari, or Edge on your mobile device to install.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-2 text-sm">Benefits of installing:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Faster loading times
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Easy access from home screen
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Full screen experience
              </li>
            </ul>
          </div>

          <Link to="/" className="block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
