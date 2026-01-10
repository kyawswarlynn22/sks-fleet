-- Enum types for statuses
CREATE TYPE public.car_type AS ENUM ('electric', 'gas');
CREATE TYPE public.trip_status AS ENUM ('idle', 'heading_to_pickup', 'on_highway', 'rest_stop', 'completed');
CREATE TYPE public.expense_category AS ENUM ('fuel', 'charging', 'toll', 'commission', 'repair', 'maintenance', 'other');

-- Cars table
CREATE TABLE public.cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    car_type car_type NOT NULL DEFAULT 'gas',
    mileage INTEGER NOT NULL DEFAULT 0,
    health_score INTEGER GENERATED ALWAYS AS (GREATEST(0, 100 - (mileage / 1000))) STORED,
    current_charge_percent INTEGER DEFAULT NULL,
    battery_health INTEGER DEFAULT NULL,
    fuel_level INTEGER DEFAULT NULL,
    oil_change_mileage INTEGER DEFAULT 5000,
    last_oil_change_mileage INTEGER DEFAULT 0,
    status trip_status NOT NULL DEFAULT 'idle',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    license_uploaded BOOLEAN NOT NULL DEFAULT false,
    permit_uploaded BOOLEAN NOT NULL DEFAULT false,
    hours_driven_today DECIMAL(4,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routes table
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    estimated_tolls DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-orders table
CREATE TABLE public.preorders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    assigned_car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active trips table
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    preorder_id UUID REFERENCES public.preorders(id) ON DELETE SET NULL,
    status trip_status NOT NULL DEFAULT 'heading_to_pickup',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    total_fare DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Energy logs (charging/fueling)
CREATE TABLE public.energy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    log_type TEXT NOT NULL,
    location TEXT,
    amount DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    kwh DECIMAL(10,2),
    price_per_unit DECIMAL(10,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance logs
CREATE TABLE public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    maintenance_type TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    mileage_at_service INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial ledger
CREATE TABLE public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type TEXT NOT NULL,
    category expense_category,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- For this admin panel, allow authenticated users full access
CREATE POLICY "Allow authenticated read cars" ON public.cars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update cars" ON public.cars FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete cars" ON public.cars FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read drivers" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update drivers" ON public.drivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete drivers" ON public.drivers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read routes" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert routes" ON public.routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update routes" ON public.routes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete routes" ON public.routes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read preorders" ON public.preorders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert preorders" ON public.preorders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update preorders" ON public.preorders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete preorders" ON public.preorders FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update trips" ON public.trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read energy_logs" ON public.energy_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert energy_logs" ON public.energy_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update energy_logs" ON public.energy_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete energy_logs" ON public.energy_logs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read maintenance_logs" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert maintenance_logs" ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update maintenance_logs" ON public.maintenance_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete maintenance_logs" ON public.maintenance_logs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read ledger" ON public.ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert ledger" ON public.ledger FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update ledger" ON public.ledger FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete ledger" ON public.ledger FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();