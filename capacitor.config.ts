import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.30b2a10a7bdd4276ace4b8cce5f981f1',
  appName: 'sks-fleet',
  webDir: 'dist',
  server: {
    url: 'https://30b2a10a-7bdd-4276-ace4-b8cce5f981f1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BackgroundGeolocation: {
      license: 'YOUR_LICENSE_KEY_HERE' // Optional - works without license in debug mode
    }
  }
};

export default config;
