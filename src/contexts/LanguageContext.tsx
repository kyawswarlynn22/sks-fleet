import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "mm";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.staffLogin": "Staff Login",
    
    // Hero
    "hero.title": "Premium",
    "hero.titleHighlight": "Highway Transport",
    "hero.titleEnd": "Service",
    "hero.description": "Travel safely and comfortably between cities with Shwe Leo's professional fleet. Book your trip online in minutes.",
    "hero.bookNow": "Book Now",
    "hero.viewRoutes": "View Routes",
    
    // Features
    "features.fleet.title": "Modern Fleet",
    "features.fleet.description": "Electric and gas vehicles maintained to the highest standards",
    "features.scheduling.title": "Flexible Scheduling",
    "features.scheduling.description": "Multiple departure times to fit your schedule",
    "features.booking.title": "Easy Booking",
    "features.booking.description": "Book online or call us - we confirm within hours",
    
    // Routes
    "routes.title": "Our Routes",
    "routes.description": "We operate on the most popular intercity routes. All prices include tolls and taxes.",
    "routes.noRoutes": "No routes available at the moment.",
    
    // Booking
    "booking.title": "Book Your Trip",
    "booking.description": "Fill in the form below and we'll confirm your booking within a few hours.",
    "booking.name": "Your Name",
    "booking.phone": "Phone Number",
    "booking.phonePlaceholder": "09xxxxxxxxx",
    "booking.selectRoute": "Select Route",
    "booking.chooseRoute": "Choose your route",
    "booking.travelDate": "Travel Date",
    "booking.pickDate": "Pick a date",
    "booking.departureTime": "Departure Time",
    "booking.selectTime": "Select time",
    "booking.notes": "Additional Notes (optional)",
    "booking.notesPlaceholder": "Any special requests or information...",
    "booking.submit": "Submit Booking",
    "booking.submitting": "Submitting...",
    "booking.price": "Price",
    
    // Success
    "success.title": "Booking Confirmed!",
    "success.description": "Thank you for your booking. We will contact you shortly to confirm your trip details.",
    "success.bookAnother": "Book Another Trip",
    
    // Contact
    "contact.title": "Contact Us",
    "contact.description": "Have questions? Get in touch with us directly.",
    "contact.callUs": "Call us",
    
    // Footer
    "footer.rights": "All rights reserved.",
  },
  mm: {
    // Header
    "nav.staffLogin": "ဝန်ထမ်းဝင်ရောက်ရန်",
    
    // Hero
    "hero.title": "အဆင့်မြင့်",
    "hero.titleHighlight": "အဝေးပြေး သယ်ယူပို့ဆောင်ရေး",
    "hero.titleEnd": "ဝန်ဆောင်မှု",
    "hero.description": "Shwe Leo ၏ ကျွမ်းကျင်သော ကားများဖြင့် မြို့များကြား လုံခြုံစွာ သက်တောင့်သက်သာ ခရီးသွားပါ။ မိနစ်ပိုင်းအတွင်း အွန်လိုင်းမှ ကြိုတင်မှာယူပါ။",
    "hero.bookNow": "ယခုဘွတ်ကင်",
    "hero.viewRoutes": "လမ်းကြောင်းများကြည့်ရန်",
    
    // Features
    "features.fleet.title": "ခေတ်မီကားများ",
    "features.fleet.description": "အမြင့်ဆုံးစံနှုန်းများဖြင့် ထိန်းသိမ်းထားသော လျှပ်စစ်နှင့် ဓာတ်ဆီကားများ",
    "features.scheduling.title": "ပြောင်းလွယ်သော အချိန်ဇယား",
    "features.scheduling.description": "သင့်အချိန်ဇယားနှင့် ကိုက်ညီရန် ထွက်ခွာချိန်များစွာ",
    "features.booking.title": "လွယ်ကူသော ဘွတ်ကင်",
    "features.booking.description": "အွန်လိုင်းမှ ဘွတ်ကင်လုပ်ပါ သို့မဟုတ် ဖုန်းဆက်ပါ - နာရီပိုင်းအတွင်း အတည်ပြုပေးပါမည်",
    
    // Routes
    "routes.title": "ကျွန်ုပ်တို့၏ လမ်းကြောင်းများ",
    "routes.description": "ကျွန်ုပ်တို့သည် လူကြိုက်များသော မြို့ချင်းဆက် လမ်းကြောင်းများတွင် ပြေးဆွဲပါသည်။ ဈေးနှုန်းများတွင် တံတားခနှင့် အခွန်များ ပါဝင်ပြီးဖြစ်သည်။",
    "routes.noRoutes": "လောလောဆယ် လမ်းကြောင်းမရှိပါ။",
    
    // Booking
    "booking.title": "သင့်ခရီးစဉ်ကို ဘွတ်ကင်လုပ်ပါ",
    "booking.description": "အောက်ပါဖောင်ကို ဖြည့်ပါ၊ နာရီပိုင်းအတွင်း သင့်ဘွတ်ကင်ကို အတည်ပြုပေးပါမည်။",
    "booking.name": "သင့်အမည်",
    "booking.phone": "ဖုန်းနံပါတ်",
    "booking.phonePlaceholder": "၀၉xxxxxxxxx",
    "booking.selectRoute": "လမ်းကြောင်းရွေးပါ",
    "booking.chooseRoute": "သင့်လမ်းကြောင်းကို ရွေးပါ",
    "booking.travelDate": "ခရီးသွားမည့်ရက်",
    "booking.pickDate": "ရက်ရွေးပါ",
    "booking.departureTime": "ထွက်ခွာမည့်အချိန်",
    "booking.selectTime": "အချိန်ရွေးပါ",
    "booking.notes": "မှတ်ချက်များ (ရွေးချယ်နိုင်)",
    "booking.notesPlaceholder": "အထူးတောင်းဆိုချက် သို့မဟုတ် အချက်အလက်များ...",
    "booking.submit": "ဘွတ်ကင်တင်သွင်းရန်",
    "booking.submitting": "တင်သွင်းနေသည်...",
    "booking.price": "ဈေးနှုန်း",
    
    // Success
    "success.title": "ဘွတ်ကင်အတည်ပြုပြီးပါပြီ!",
    "success.description": "ဘွတ်ကင်လုပ်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။ သင့်ခရီးစဉ်အသေးစိတ်ကို အတည်ပြုရန် မကြာမီ ဆက်သွယ်ပါမည်။",
    "success.bookAnother": "နောက်ထပ်ခရီးစဉ် ဘွတ်ကင်လုပ်ရန်",
    
    // Contact
    "contact.title": "ဆက်သွယ်ရန်",
    "contact.description": "မေးခွန်းများရှိပါသလား? ကျွန်ုပ်တို့ထံ တိုက်ရိုက်ဆက်သွယ်ပါ။",
    "contact.callUs": "ဖုန်းဆက်ရန်",
    
    // Footer
    "footer.rights": "မူပိုင်ခွင့်များ အားလုံးရယူထားသည်။",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
