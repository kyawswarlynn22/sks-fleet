-- Create table for storing real-time vehicle locations
CREATE TABLE public.vehicle_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  heading numeric DEFAULT 0,
  speed numeric DEFAULT 0,
  accuracy numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by trip
CREATE INDEX idx_vehicle_locations_trip_id ON public.vehicle_locations(trip_id);
CREATE INDEX idx_vehicle_locations_recorded_at ON public.vehicle_locations(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all locations
CREATE POLICY "Admins manage vehicle_locations"
ON public.vehicle_locations FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Drivers can view all locations (for their own tracking awareness)
CREATE POLICY "Drivers can view vehicle_locations"
ON public.vehicle_locations FOR SELECT
USING (has_role(auth.uid(), 'driver'));

-- Drivers can insert their own locations
CREATE POLICY "Drivers can insert vehicle_locations"
ON public.vehicle_locations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'driver'));

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_locations;