-- Drop any existing constraints first, then add them
DO $$ 
BEGIN
    -- Preorders constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'preorders_route_id_fkey') THEN
        ALTER TABLE public.preorders DROP CONSTRAINT preorders_route_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'preorders_assigned_car_id_fkey') THEN
        ALTER TABLE public.preorders DROP CONSTRAINT preorders_assigned_car_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'preorders_assigned_driver_id_fkey') THEN
        ALTER TABLE public.preorders DROP CONSTRAINT preorders_assigned_driver_id_fkey;
    END IF;
    
    -- Trips constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_car_id_fkey') THEN
        ALTER TABLE public.trips DROP CONSTRAINT trips_car_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_driver_id_fkey') THEN
        ALTER TABLE public.trips DROP CONSTRAINT trips_driver_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_route_id_fkey') THEN
        ALTER TABLE public.trips DROP CONSTRAINT trips_route_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_preorder_id_fkey') THEN
        ALTER TABLE public.trips DROP CONSTRAINT trips_preorder_id_fkey;
    END IF;
    
    -- Energy logs constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'energy_logs_car_id_fkey') THEN
        ALTER TABLE public.energy_logs DROP CONSTRAINT energy_logs_car_id_fkey;
    END IF;
    
    -- Ledger constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_car_id_fkey') THEN
        ALTER TABLE public.ledger DROP CONSTRAINT ledger_car_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_driver_id_fkey') THEN
        ALTER TABLE public.ledger DROP CONSTRAINT ledger_driver_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_trip_id_fkey') THEN
        ALTER TABLE public.ledger DROP CONSTRAINT ledger_trip_id_fkey;
    END IF;
    
    -- Maintenance logs constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_logs_car_id_fkey') THEN
        ALTER TABLE public.maintenance_logs DROP CONSTRAINT maintenance_logs_car_id_fkey;
    END IF;
END $$;

-- Now add all foreign key constraints
ALTER TABLE public.preorders
ADD CONSTRAINT preorders_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);

ALTER TABLE public.preorders
ADD CONSTRAINT preorders_assigned_car_id_fkey FOREIGN KEY (assigned_car_id) REFERENCES public.cars(id);

ALTER TABLE public.preorders
ADD CONSTRAINT preorders_assigned_driver_id_fkey FOREIGN KEY (assigned_driver_id) REFERENCES public.drivers(id);

ALTER TABLE public.trips
ADD CONSTRAINT trips_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id);

ALTER TABLE public.trips
ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

ALTER TABLE public.trips
ADD CONSTRAINT trips_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);

ALTER TABLE public.trips
ADD CONSTRAINT trips_preorder_id_fkey FOREIGN KEY (preorder_id) REFERENCES public.preorders(id);

ALTER TABLE public.energy_logs
ADD CONSTRAINT energy_logs_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id);

ALTER TABLE public.ledger
ADD CONSTRAINT ledger_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id);

ALTER TABLE public.ledger
ADD CONSTRAINT ledger_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

ALTER TABLE public.ledger
ADD CONSTRAINT ledger_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id);

ALTER TABLE public.maintenance_logs
ADD CONSTRAINT maintenance_logs_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id);