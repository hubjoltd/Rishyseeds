--
-- PostgreSQL database dump
--

\restrict dH853fTueHsEgOwU3F7OEyfQA3isqOSkBP6qISCafEKXRfEKQPOgrC4LXv32qxA

-- Dumped from database version 16.12 (6d3029c)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_employee_id_employees_id_fk;
DROP INDEX IF EXISTS _system.idx_replit_database_migrations_v1_build_id;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.trips DROP CONSTRAINT IF EXISTS trips_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_visits DROP CONSTRAINT IF EXISTS trip_visits_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_comments DROP CONSTRAINT IF EXISTS trip_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_audit_history DROP CONSTRAINT IF EXISTS trip_audit_history_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_task_code_unique;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS task_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_entries DROP CONSTRAINT IF EXISTS stock_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_balances DROP CONSTRAINT IF EXISTS stock_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_variety_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.processing_records DROP CONSTRAINT IF EXISTS processing_records_pkey;
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS payrolls_pkey;
ALTER TABLE IF EXISTS ONLY public.packaging_sizes DROP CONSTRAINT IF EXISTS packaging_sizes_pkey;
ALTER TABLE IF EXISTS ONLY public.packaging_outputs DROP CONSTRAINT IF EXISTS packaging_outputs_pkey;
ALTER TABLE IF EXISTS ONLY public.outward_records DROP CONSTRAINT IF EXISTS outward_records_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.lots DROP CONSTRAINT IF EXISTS lots_pkey;
ALTER TABLE IF EXISTS ONLY public.lots DROP CONSTRAINT IF EXISTS lots_lot_number_unique;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_expense_code_unique;
ALTER TABLE IF EXISTS ONLY public.expense_comments DROP CONSTRAINT IF EXISTS expense_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_audit_history DROP CONSTRAINT IF EXISTS expense_audit_history_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_employee_id_unique;
ALTER TABLE IF EXISTS ONLY public.dryer_entries DROP CONSTRAINT IF EXISTS dryer_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_batch_number_unique;
ALTER TABLE IF EXISTS ONLY public.attendance DROP CONSTRAINT IF EXISTS attendance_pkey;
ALTER TABLE IF EXISTS ONLY _system.replit_database_migrations_v1 DROP CONSTRAINT IF EXISTS replit_database_migrations_v1_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trips ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_visits ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_audit_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.task_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_movements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_balances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.processing_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payrolls ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.packaging_sizes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.packaging_outputs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.outward_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.locations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expense_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expense_audit_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dryer_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.attendance ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS _system.replit_database_migrations_v1 ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.trips_id_seq;
DROP TABLE IF EXISTS public.trips;
DROP SEQUENCE IF EXISTS public.trip_visits_id_seq;
DROP TABLE IF EXISTS public.trip_visits;
DROP SEQUENCE IF EXISTS public.trip_comments_id_seq;
DROP TABLE IF EXISTS public.trip_comments;
DROP SEQUENCE IF EXISTS public.trip_audit_history_id_seq;
DROP TABLE IF EXISTS public.trip_audit_history;
DROP SEQUENCE IF EXISTS public.tasks_id_seq;
DROP TABLE IF EXISTS public.tasks;
DROP SEQUENCE IF EXISTS public.task_comments_id_seq;
DROP TABLE IF EXISTS public.task_comments;
DROP SEQUENCE IF EXISTS public.stock_movements_id_seq;
DROP TABLE IF EXISTS public.stock_movements;
DROP SEQUENCE IF EXISTS public.stock_entries_id_seq;
DROP TABLE IF EXISTS public.stock_entries;
DROP SEQUENCE IF EXISTS public.stock_balances_id_seq;
DROP TABLE IF EXISTS public.stock_balances;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.processing_records_id_seq;
DROP TABLE IF EXISTS public.processing_records;
DROP SEQUENCE IF EXISTS public.payrolls_id_seq;
DROP TABLE IF EXISTS public.payrolls;
DROP SEQUENCE IF EXISTS public.packaging_sizes_id_seq;
DROP TABLE IF EXISTS public.packaging_sizes;
DROP SEQUENCE IF EXISTS public.packaging_outputs_id_seq;
DROP TABLE IF EXISTS public.packaging_outputs;
DROP SEQUENCE IF EXISTS public.outward_records_id_seq;
DROP TABLE IF EXISTS public.outward_records;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.lots_id_seq;
DROP TABLE IF EXISTS public.lots;
DROP SEQUENCE IF EXISTS public.locations_id_seq;
DROP TABLE IF EXISTS public.locations;
DROP SEQUENCE IF EXISTS public.expenses_id_seq;
DROP TABLE IF EXISTS public.expenses;
DROP SEQUENCE IF EXISTS public.expense_comments_id_seq;
DROP TABLE IF EXISTS public.expense_comments;
DROP SEQUENCE IF EXISTS public.expense_audit_history_id_seq;
DROP TABLE IF EXISTS public.expense_audit_history;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.dryer_entries_id_seq;
DROP TABLE IF EXISTS public.dryer_entries;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.batches_id_seq;
DROP TABLE IF EXISTS public.batches;
DROP SEQUENCE IF EXISTS public.attendance_id_seq;
DROP TABLE IF EXISTS public.attendance;
DROP SEQUENCE IF EXISTS _system.replit_database_migrations_v1_id_seq;
DROP TABLE IF EXISTS _system.replit_database_migrations_v1;
DROP SCHEMA IF EXISTS _system;
--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _system;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: -
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: -
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: -
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date date NOT NULL,
    status text NOT NULL,
    shift text,
    check_in text,
    check_out text,
    check_in_latitude text,
    check_in_longitude text,
    check_in_location text,
    check_out_latitude text,
    check_out_longitude text,
    check_out_location text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    batch_number text NOT NULL,
    crop text NOT NULL,
    variety text NOT NULL,
    lot_size numeric NOT NULL,
    production_date date,
    current_quantity numeric NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    mobile text,
    email text,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    owner_employee_id integer,
    owner_name text,
    reporting_manager_name text,
    source text DEFAULT 'visit'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: dryer_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dryer_entries (
    id integer NOT NULL,
    bin_no integer NOT NULL,
    organiser text,
    variety text,
    intake_quantity numeric,
    date_of_intake date NOT NULL,
    five_day_due_date date NOT NULL,
    shelling_date date,
    shelling_qty numeric,
    intake_moisture numeric,
    status text DEFAULT 'pending'::text NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dryer_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dryer_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dryer_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dryer_entries_id_seq OWNED BY public.dryer_entries.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    department text,
    work_location text,
    salary_type text NOT NULL,
    basic_salary numeric NOT NULL,
    hra numeric DEFAULT '0'::numeric,
    da numeric DEFAULT '0'::numeric,
    travel_allowance numeric DEFAULT '0'::numeric,
    medical_allowance numeric DEFAULT '0'::numeric,
    other_allowances numeric DEFAULT '0'::numeric,
    pf_deduction numeric DEFAULT '0'::numeric,
    esi_deduction numeric DEFAULT '0'::numeric,
    tds_deduction numeric DEFAULT '0'::numeric,
    other_deductions numeric DEFAULT '0'::numeric,
    bank_name text,
    bank_account_number text,
    ifsc_code text,
    pan_number text,
    phone text,
    email text,
    address text,
    status text DEFAULT 'active'::text,
    join_date date,
    password text,
    created_at timestamp without time zone DEFAULT now(),
    professional_tax numeric DEFAULT '0'::numeric
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expense_audit_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_audit_history (
    id integer NOT NULL,
    expense_id integer NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by_name text NOT NULL,
    notes text,
    changed_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_audit_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_audit_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_audit_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_audit_history_id_seq OWNED BY public.expense_audit_history.id;


--
-- Name: expense_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_comments (
    id integer NOT NULL,
    expense_id integer NOT NULL,
    message text NOT NULL,
    created_by_name text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_comments_id_seq OWNED BY public.expense_comments.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    expense_code text NOT NULL,
    title text NOT NULL,
    employee_db_id integer NOT NULL,
    category text DEFAULT 'Expense'::text NOT NULL,
    type text DEFAULT 'Expense'::text NOT NULL,
    amount numeric DEFAULT '0'::numeric NOT NULL,
    expense_date date NOT NULL,
    description text,
    work_location text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_amount numeric,
    admin_comment text,
    starting_odometer numeric,
    starting_odometer_photo text,
    end_odometer numeric,
    end_odometer_photo text,
    total_distance numeric,
    amount_per_km numeric,
    total_travel_amount numeric,
    expense_category text,
    final_amount numeric,
    status_updated_by text,
    status_updated_on timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    capacity integer,
    address text,
    is_active boolean DEFAULT true
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lots (
    id integer NOT NULL,
    lot_number text NOT NULL,
    product_id integer NOT NULL,
    source_type text NOT NULL,
    source_reference_id integer,
    source_name text,
    initial_quantity numeric NOT NULL,
    quantity_unit text DEFAULT 'kg'::text NOT NULL,
    stock_form text DEFAULT 'loose'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    inward_date date DEFAULT now(),
    expiry_date date,
    remarks text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: lots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lots_id_seq OWNED BY public.lots.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    employee_id integer,
    employee_name text,
    resource_type text,
    resource_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: outward_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outward_records (
    id integer NOT NULL,
    lot_id integer NOT NULL,
    location_id integer NOT NULL,
    stock_form text NOT NULL,
    packet_size text,
    quantity numeric NOT NULL,
    destination_type text NOT NULL,
    destination_name text,
    variety text,
    invoice_number text,
    vehicle_number text,
    dispatch_date date DEFAULT now(),
    dispatched_by text,
    driver_name text,
    remarks text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: outward_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outward_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outward_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outward_records_id_seq OWNED BY public.outward_records.id;


--
-- Name: packaging_outputs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packaging_outputs (
    id integer NOT NULL,
    batch_id integer,
    lot_id integer,
    location_id integer,
    packaging_size_id integer,
    packet_size text NOT NULL,
    number_of_packets integer NOT NULL,
    total_quantity_kg numeric,
    waste_quantity numeric DEFAULT '0'::numeric,
    production_date date DEFAULT now(),
    packed_by text,
    remarks text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: packaging_outputs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.packaging_outputs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: packaging_outputs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.packaging_outputs_id_seq OWNED BY public.packaging_outputs.id;


--
-- Name: packaging_sizes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packaging_sizes (
    id integer NOT NULL,
    size numeric NOT NULL,
    unit text DEFAULT 'Kg'::text NOT NULL,
    label text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: packaging_sizes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.packaging_sizes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: packaging_sizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.packaging_sizes_id_seq OWNED BY public.packaging_sizes.id;


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month text NOT NULL,
    total_days integer NOT NULL,
    present_days numeric NOT NULL,
    basic_pay numeric NOT NULL,
    allowances numeric DEFAULT '0'::numeric,
    overtime_amount numeric DEFAULT '0'::numeric,
    deductions numeric DEFAULT '0'::numeric,
    net_salary numeric NOT NULL,
    status text DEFAULT 'generated'::text,
    generated_date date DEFAULT now()
);


--
-- Name: payrolls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payrolls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payrolls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payrolls_id_seq OWNED BY public.payrolls.id;


--
-- Name: processing_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_records (
    id integer NOT NULL,
    input_lot_id integer NOT NULL,
    input_quantity numeric NOT NULL,
    output_lot_id integer,
    output_quantity numeric,
    waste_quantity numeric DEFAULT '0'::numeric,
    processing_type text NOT NULL,
    processing_date date DEFAULT now(),
    processed_by text,
    remarks text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: processing_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.processing_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processing_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.processing_records_id_seq OWNED BY public.processing_records.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    crop text NOT NULL,
    variety text NOT NULL,
    type text DEFAULT 'notified'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: stock_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_balances (
    id integer NOT NULL,
    lot_id integer NOT NULL,
    location_id integer NOT NULL,
    stock_form text DEFAULT 'loose'::text NOT NULL,
    packet_size text,
    quantity numeric NOT NULL,
    last_updated timestamp without time zone DEFAULT now()
);


--
-- Name: stock_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_balances_id_seq OWNED BY public.stock_balances.id;


--
-- Name: stock_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_entries (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    location_id integer NOT NULL,
    quantity numeric NOT NULL,
    entry_date date DEFAULT now(),
    responsible_person text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: stock_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_entries_id_seq OWNED BY public.stock_entries.id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    batch_id integer,
    lot_id integer,
    from_location_id integer NOT NULL,
    to_location_id integer NOT NULL,
    quantity numeric NOT NULL,
    stock_form text,
    movement_date date DEFAULT now(),
    responsible_person text,
    remarks text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    message text NOT NULL,
    created_by_name text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: task_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_comments_id_seq OWNED BY public.task_comments.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    task_code text NOT NULL,
    title text NOT NULL,
    employee_db_id integer NOT NULL,
    customer_name text,
    customer_address text,
    work_location text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    stage text,
    type text DEFAULT 'Visit'::text NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by_name text,
    notes text,
    check_in_latitude numeric,
    check_in_longitude numeric,
    check_in_location_name text,
    check_in_time timestamp without time zone,
    check_in_photo text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: trip_audit_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_audit_history (
    id integer NOT NULL,
    trip_id integer NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by_name text NOT NULL,
    notes text,
    changed_at timestamp without time zone DEFAULT now()
);


--
-- Name: trip_audit_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trip_audit_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trip_audit_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trip_audit_history_id_seq OWNED BY public.trip_audit_history.id;


--
-- Name: trip_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_comments (
    id integer NOT NULL,
    trip_id integer NOT NULL,
    message text NOT NULL,
    created_by_name text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: trip_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trip_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trip_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trip_comments_id_seq OWNED BY public.trip_comments.id;


--
-- Name: trip_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_visits (
    id integer NOT NULL,
    trip_id integer NOT NULL,
    punch_in_time timestamp without time zone,
    punch_out_time timestamp without time zone,
    punch_in_latitude numeric,
    punch_in_longitude numeric,
    punch_in_location_name text,
    punch_out_latitude numeric,
    punch_out_longitude numeric,
    punch_out_location_name text,
    punch_in_photo text,
    punch_out_photo text,
    status text DEFAULT 'punched_in'::text NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    customer_name text,
    customer_address text
);


--
-- Name: trip_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trip_visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trip_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trip_visits_id_seq OWNED BY public.trip_visits.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    status text DEFAULT 'started'::text NOT NULL,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    start_latitude numeric,
    start_longitude numeric,
    start_location_name text,
    end_latitude numeric,
    end_longitude numeric,
    end_location_name text,
    start_meter_photo text,
    end_meter_photo text,
    start_meter_reading numeric,
    end_meter_reading numeric,
    total_km numeric,
    expense_amount numeric,
    rejection_reason text,
    approved_by integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    full_name text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: dryer_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dryer_entries ALTER COLUMN id SET DEFAULT nextval('public.dryer_entries_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expense_audit_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_history ALTER COLUMN id SET DEFAULT nextval('public.expense_audit_history_id_seq'::regclass);


--
-- Name: expense_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_comments ALTER COLUMN id SET DEFAULT nextval('public.expense_comments_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: outward_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outward_records ALTER COLUMN id SET DEFAULT nextval('public.outward_records_id_seq'::regclass);


--
-- Name: packaging_outputs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packaging_outputs ALTER COLUMN id SET DEFAULT nextval('public.packaging_outputs_id_seq'::regclass);


--
-- Name: packaging_sizes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packaging_sizes ALTER COLUMN id SET DEFAULT nextval('public.packaging_sizes_id_seq'::regclass);


--
-- Name: payrolls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls ALTER COLUMN id SET DEFAULT nextval('public.payrolls_id_seq'::regclass);


--
-- Name: processing_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_records ALTER COLUMN id SET DEFAULT nextval('public.processing_records_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: stock_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances ALTER COLUMN id SET DEFAULT nextval('public.stock_balances_id_seq'::regclass);


--
-- Name: stock_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_entries ALTER COLUMN id SET DEFAULT nextval('public.stock_entries_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: task_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments ALTER COLUMN id SET DEFAULT nextval('public.task_comments_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: trip_audit_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_audit_history ALTER COLUMN id SET DEFAULT nextval('public.trip_audit_history_id_seq'::regclass);


--
-- Name: trip_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_comments ALTER COLUMN id SET DEFAULT nextval('public.trip_comments_id_seq'::regclass);


--
-- Name: trip_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_visits ALTER COLUMN id SET DEFAULT nextval('public.trip_visits_id_seq'::regclass);


--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: -
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	9b8c53fe-b080-4c69-ac99-e4bbd59269b6	bea9cba5-ce59-483f-af2c-afb817365545	10	2026-03-11 09:17:40.336551+00
2	c12d7f6a-b51a-483b-a525-4747611840c4	bea9cba5-ce59-483f-af2c-afb817365545	1	2026-03-12 07:30:05.939724+00
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, employee_id, date, status, shift, check_in, check_out, check_in_latitude, check_in_longitude, check_in_location, check_out_latitude, check_out_longitude, check_out_location, created_at) FROM stdin;
2	17	2026-03-12	present	\N	09:36	\N	\N	\N	\N	\N	\N	\N	2026-03-12 04:06:59.257386
3	18	2026-03-12	present	\N	09:45	\N	\N	\N	\N	\N	\N	\N	2026-03-12 04:15:23.733468
4	28	2026-03-12	present	\N	09:55	\N	\N	\N	\N	\N	\N	\N	2026-03-12 04:25:13.890116
5	37	2026-03-12	present	\N	10:11	\N	\N	\N	\N	\N	\N	\N	2026-03-12 04:41:25.831806
1	3	2026-03-12	present	\N	09:29	10:28	\N	\N	\N	\N	\N	\N	2026-03-12 03:59:11.418451
6	3	2026-03-13	present	\N	09:19	\N	\N	\N	\N	\N	\N	\N	2026-03-13 03:49:29.724318
7	17	2026-03-13	present	\N	09:20	\N	17.5780659	78.5054801	Shamirpet mandal, Medchal mandal, Telangana	\N	\N	\N	2026-03-13 03:50:48.076059
8	18	2026-03-13	present	\N	09:21	\N	\N	\N	\N	\N	\N	\N	2026-03-13 03:51:34.659237
9	28	2026-03-13	present	\N	09:25	19:27	\N	\N	\N	\N	\N	\N	2026-03-13 03:55:45.227836
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.batches (id, batch_number, crop, variety, lot_size, production_date, current_quantity, status, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, mobile, email, address, status, owner_employee_id, owner_name, reporting_manager_name, source, created_at, updated_at) FROM stdin;
1	Malothra pvt ltd	\N	\N	Hsjsjsjs	active	1	V. Prathap Reddy	\N	visit	2026-03-12 09:27:58.652854	2026-03-12 09:27:58.652854
\.


--
-- Data for Name: dryer_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dryer_entries (id, bin_no, organiser, variety, intake_quantity, date_of_intake, five_day_due_date, shelling_date, shelling_qty, intake_moisture, status, remarks, created_at, updated_at) FROM stdin;
1	1	Star	star001	\N	2026-03-11	2026-03-16	\N	\N	\N	intake	\N	2026-03-12 16:27:23.422833	2026-03-12 16:27:23.422833
2	2	Star	star001	\N	2026-03-08	2026-03-13	\N	\N	\N	intake	\N	2026-03-12 16:27:54.855553	2026-03-12 16:27:54.855553
3	3	eshwarsunrich	Sun	\N	2026-03-11	2026-03-16	\N	\N	\N	intake	\N	2026-03-12 16:28:29.282944	2026-03-12 16:28:29.282944
4	4	Pml venkat		\N	2026-03-10	2026-03-15	\N	\N	\N	intake	\N	2026-03-12 16:29:12.465752	2026-03-12 16:29:12.465752
5	6	Star	star001	\N	2026-03-11	2026-03-16	\N	\N	\N	intake	\N	2026-03-12 16:29:51.197655	2026-03-12 16:29:51.197655
7	8	Star	star001	\N	2026-03-08	2026-03-13	\N	\N	\N	intake	\N	2026-03-12 16:30:44.931581	2026-03-12 16:30:44.931581
9	10	Pml venkat		\N	2026-03-10	2026-03-15	\N	\N	\N	intake	\N	2026-03-12 16:31:25.657228	2026-03-12 16:31:25.657228
10	5	Pml venkat		\N	2026-03-12	2026-03-17	\N	\N	\N	intake	\N	2026-03-12 16:32:02.977079	2026-03-12 16:32:02.977079
6	7	Hiranya		\N	2026-03-10	2026-03-15	2026-03-13	2250	\N	outtake	\N	2026-03-12 16:30:13.372431	2026-03-13 09:50:20.959
8	9	Hiranya		\N	2026-03-09	2026-03-14	\N	5000	\N	outtake	\N	2026-03-12 16:31:06.029826	2026-03-13 09:50:46.064
11	7	Pml venkat	Pml	\N	2026-03-13	2026-03-18	\N	\N	\N	intake	\N	2026-03-13 09:51:19.208816	2026-03-13 09:51:19.208816
12	9	Kotireddy		\N	2026-03-13	2026-03-18	2026-03-13	\N	\N	intake	\N	2026-03-13 09:52:02.257265	2026-03-13 09:52:13.239
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_id, full_name, role, department, work_location, salary_type, basic_salary, hra, da, travel_allowance, medical_allowance, other_allowances, pf_deduction, esi_deduction, tds_deduction, other_deductions, bank_name, bank_account_number, ifsc_code, pan_number, phone, email, address, status, join_date, password, created_at, professional_tax) FROM stdin;
1	EMP001	V. Prathap Reddy	Managing Director	Management	Hyderabad	monthly	44568	38997	0	0	0	22856	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	active	\N	EMP001	2026-03-11 06:47:16.860123	0
2	EMP002	Avula Krupakar	Adm Plant	Administration	Hyderabad	monthly	44575	39003	0	0	0	22660	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	active	\N	EMP002	2026-03-11 06:47:16.882844	0
25	EMP025	Suneel Sahu	Field Associate	Field	Gadasarai	monthly	7200	6300	0	0	0	4500	0	0	0	0	\N	\N	\N	\N	9575235447	sahuji7434@gmail.com	\N	active	\N	EMP025	2026-03-11 06:47:17.357334	0
29	EMP029	Gajje Narsimha	Sales Officer	Sales	Amangal	monthly	8800	7700	0	0	0	5500	0	0	0	0	\N	\N	\N	\N	9705942135	narsimhagoud7748@gmail.com	\N	active	\N	EMP029	2026-03-11 06:47:17.439832	0
34	EMP034	Shovit Kumar Pandey	Sales Officer	Sales	Bareilly	monthly	6400	5600	0	0	0	4000	0	0	0	0	\N	\N	\N	\N	8126553341	shovitpandey777@gmail.com	\N	active	\N	EMP034	2026-03-11 06:47:17.543168	0
3	EMP003	Katta Gopi	Plant Accounts	Accounts	Hyderabad	monthly	11000	9625	0	0	0	2130	0	0	0	0					9177058951	kattagopi1996@gmail.com	admin	active	\N	Gopi@123	2026-03-11 06:47:16.903355	0
5	EMP005	Boddu Sandeep	Plant SR. Production	Production	Karimnagar	monthly	12760	11165	0	0	0	3496	0	0	0	0					9700352457	boddu.sandeep143@gmail.com	admin	active	\N	Sandeep@123	2026-03-11 06:47:16.945373	0
6	EMP006	Sikke Purushotham	Plant SEM	Sales	Siddipet	monthly	11000	9625	0	0	0	3188	0	0	0	0					9908140108	purushotham.sikke@gmail.com	admin	active	\N	Purushotham@123	2026-03-11 06:47:16.965902	0
7	EMP007	Tekulapally Anil Reddy	Plant Sales Officer	Sales	Gajwel	monthly	12000	10500	0	0	0	7500	0	0	0	0					8885726608	anilreddy121212tekulapally@gmail.com	admin	active	\N	Anil@123	2026-03-11 06:47:16.9865	0
9	EMP009	Raj Kumar Singh	Plant RM	Sales	Shadool	monthly	22464	19656	0	0	0	5806	0	0	0	0					9981411847	rk3612@gmail.com	admin	active	\N	Rajkumar@123	2026-03-11 06:47:17.027175	0
10	EMP010	Amit Singh Baghel	Plant ASM	Sales	Katni	monthly	12320	10780	0	0	0	3650	0	0	0	0					9644101304	amitsingh1994.baghel@gmail.com	admin	active	\N	Amit@123	2026-03-11 06:47:17.047872	0
11	EMP011	Dinesh Kumar Thakur	Plant Sales	Sales	Ramanujanagar	monthly	8800	7700	0	0	0	2194	0	0	0	0					9753757177	dineshthakur9753@gmail.com	admin	active	\N	Dinesh@123	2026-03-11 06:47:17.068417	0
24	EMP024	Vikas Mishra	Sales	Sales	Sidhi	monthly	7200	6300	0	0	0	4500	0	0	0	0					8090245256	Mishravikas5434@gmail.com	admin	active	\N	Vikas@123	2026-03-11 06:47:17.337286	0
12	EMP012	Dharmendra Kumar	Plant SEM	Sales	Bahjoi	monthly	6560	5740	0	0	0	1596	0	0	0	0					9105942637	shivafourmulation@gmail.com	admin	active	\N	Dharmendra@123	2026-03-11 06:47:17.089358	0
14	EMP014	Babaloo Kumar	Plant SO	Sales	Lakhimpur	monthly	6760	5915	0	0	0	1596	0	0	0	0					9889024859	rahulnverma1991@gmail.com	admin	active	\N	Babaloo@123	2026-03-11 06:47:17.130889	0
15	EMP015	Shailender Singh	Plant RM	Sales	Agra	monthly	24000	21000	0	0	0	13300	0	0	0	0					9719144955	shailendra.rishiseeds@gmail.com	admin	active	\N	Shailender@123	2026-03-11 06:47:17.151906	0
16	EMP016	Viswanatha Reddy	Auditor	Accounts	Hyderabad	monthly	3600	3150	0	0	0	2250	0	0	0	0							admin	active	\N	Viswanatha@123	2026-03-11 06:47:17.172489	0
17	EMP017	Bolli Divya	PO (Research Associate)	Research	Hyderabad	monthly	6800	5950	0	0	0	4250	0	0	0	0					9640855645	bollidivya18@gmail.com	admin	active	\N	Divya@123	2026-03-11 06:47:17.193243	0
18	EMP018	Mudunuri Swathi	Veg Packing Incharge	Packaging	Hyderabad	monthly	6000	5250	0	0	0	3750	0	0	0	0					63032361969	kashukashu1111@gmail.com	admin	active	\N	Swathi@123	2026-03-11 06:47:17.214482	0
19	EMP019	Chinthala Praveen	Processing & Packing Incharge	Production	Konaipally	monthly	12400	10850	0	0	0	7750	0	0	0	0					9908036812	chpraveenps143@gmail.com	admin	active	\N	Praveen@123	2026-03-11 06:47:17.235227	0
21	EMP021	K Rajkumar	Field Associate	Field	Gopalraopet	monthly	6000	5250	0	0	0	3750	0	0	0	0					6302587459	naniprince6302@gmail.com	admin	active	\N	Rajkumar@123	2026-03-11 06:47:17.276487	0
20	EMP020	Ravelli Devender	Plant Operator	Production	Konaipally	monthly	9600	8400	0	0	0	6000	0	0	0	0					9959731825	ravellidevender123@gmail.com	admin	active	\N	Devender@123	2026-03-11 06:47:17.256106	0
22	EMP022	Dharmani Mahesh	Plant Operator	Production	Hyderabad	monthly	6000	5250	0	0	0	3750	0	0	0	0					9908008836	maheshdharmani62642@gmail.com	admin	active	\N	Mahesh@123	2026-03-11 06:47:17.296913	0
23	EMP023	Birendra Kumar Tandi	Sales Officer	Sales	Saraipali	monthly	6400	5600	0	0	0	4000	0	0	0	0					6265149504	tandibirendra993@gmail.com	admin	active	\N	Birendra@123	2026-03-11 06:47:17.317013	0
13	EMP013	Rahul Kumar	Plant SEM	Sales	Auriya	monthly	7176	6279	0	0	0	1606	0	0	0	0					9897635990	9897635990r@gmail.com	admin	active	\N	Rahul@123	2026-03-11 06:47:17.109914	0
28	EMP028	Guna Shekar	Driver	Operations	Hyderabad	monthly	6800	5950	0	0	0	4250	0	0	0	0					8522077311	gunasekhar4236@gmail.com	admin	active	\N	Guna@123	2026-03-11 06:47:17.419095	0
30	EMP030	Kavuri Dinesh Babu	Production	Production	Hyderabad	monthly	16000	14000	0	0	0	10000	0	0	0	0					9849581838	dinukavuri@gmail.com	admin	active	\N	Dinesh@123	2026-03-11 06:47:17.460104	0
33	EMP033	Horil Singh	Sales Officer	Sales	Deosar, Singrauli	monthly	7600	6650	0	0	0	4750	0	0	0	0	\N	\N	\N	\N	6266974681	horilsingh1989@gmail.com	\N	active	\N	Horil@123	2026-03-11 06:47:17.522495	0
37	EMP037	Ravikumar Yedumula	Plant Operator	Packaging	Konaipally	monthly	11000	9625	6825	0	0	0	2640	0	0	200	Kotak Mahindra Bank	0448527633	KKBK0007535	IETPK9480M	7075060407	ravikumary47@gmail.com	admin	active	2026-02-21	Ravi@123	2026-03-12 04:33:18.674446	0
35	EMP035	Krishna Kumar	Sales Officer	Sales	Pathalgaon	monthly	8480	7420	0	0	0	5300	0	0	0	0	\N	\N	\N	\N	8795843192	krishnakumaryadav3458@gmail.com	\N	active	\N	Krishna@123	2026-03-11 06:47:17.563952	0
36	EMP036	Mahamad Gulsher Ansari	Sales Officer	Sales	Balarampur	monthly	7200	6300	0	0	0	4500	0	0	0	0	\N	\N	\N	\N	9340644510	mg6733482@gmail.com	\N	active	\N	Ansari@123	2026-03-11 06:47:17.584344	0
26	EMP026	Abhishek Singh Parihar	Field Associate	Field	Satna	monthly	6400	5600	0	0	0	4000	0	0	0	0	\N	\N	\N	\N	8878096675	abhiparihar326@gmail.com	\N	active	\N	Abhishek@123	2026-03-11 06:47:17.378108	0
27	EMP027	Anil Sharma	Field Associate	Field	Beohari	monthly	7200	6300	0	0	0	4500	0	0	0	0	\N	\N	\N	\N	9826481067	Sharmaa38079@gmail.com	\N	active	\N	Anil@123	2026-03-11 06:47:17.398367	0
31	EMP031	Lalit Kumar Choudhary	Sales Officer	Sales	Balaghat	monthly	7000	6125	0	0	0	4375	0	0	0	0	\N	\N	\N	\N	9165744720	lalitchoudhary3892@gmail.com	\N	active	\N	Lalit@123	2026-03-11 06:47:17.481066	0
32	EMP032	Vivek Singh	Sales Officer	Sales	Rewa	monthly	8800	7700	0	0	0	5500	0	0	0	0	\N	\N	\N	\N	9589466784	viveksingh9589466784@gmail.com	\N	active	\N	Vivek@123	2026-03-11 06:47:17.501945	0
8	EMP008	Mahendra Kumar Baghel	Plant TSM	Sales	Seoni	monthly	10920	9555	0	0	0	6825	0	0	0	0					9131056815	mahendrakhusi1983@gmail.com	admin	active	\N	Mahendra@123	2026-03-11 06:47:17.006669	0
4	EMP004	Siripothula Naresh	Plant Quality Executive	Quality	Hyderabad	monthly	12320	10780	0	0	0	3342	0	0	0	0					8008699643	nareshsiripothula9@gmail.com	admin	active	\N	Naresh@123	2026-03-11 06:47:16.924485	0
38	EMP0038	B.Vijay kumar	Plant Operator	Packaging	Konaipally	monthly	5000	5000	0	0	2000	3000	0	0	0	0	Kotak Mahindra 	0046443762	KKBK0007530	GJKPL9304Q	91779 52663	vijaykumarbyagari019@gmail.com	admin	active	2026-02-11	Vijay@123	2026-03-13 07:03:24.925148	200
\.


--
-- Data for Name: expense_audit_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_audit_history (id, expense_id, from_status, to_status, changed_by_name, notes, changed_at) FROM stdin;
\.


--
-- Data for Name: expense_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_comments (id, expense_id, message, created_by_name, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, expense_code, title, employee_db_id, category, type, amount, expense_date, description, work_location, status, approved_amount, admin_comment, starting_odometer, starting_odometer_photo, end_odometer, end_odometer_photo, total_distance, amount_per_km, total_travel_amount, expense_category, final_amount, status_updated_by, status_updated_on, created_at) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, name, type, capacity, address, is_active) FROM stdin;
1	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
2	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
3	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
4	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
5	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
6	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
7	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
8	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
9	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
10	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
11	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
12	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
13	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
14	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
15	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
16	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
17	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
18	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
19	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
20	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
21	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
22	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
23	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
24	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
25	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
26	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
27	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
28	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
29	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
30	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
31	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
32	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
33	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
34	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
35	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
36	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
37	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
38	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
39	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
40	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
41	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
42	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
43	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
44	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
90	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
45	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
46	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
47	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
48	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
49	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
50	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
51	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
52	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
53	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
54	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
55	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
56	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
57	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
58	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
59	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
60	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
61	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
62	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
63	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
64	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
65	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
66	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
67	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
68	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
69	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
70	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
71	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
72	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
73	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
74	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
75	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
76	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
77	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
78	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
79	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
80	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
81	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
82	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
83	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
84	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
85	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
86	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
87	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
88	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
89	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
91	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
92	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
93	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
94	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
95	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
96	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
97	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
98	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
99	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
100	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
101	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
102	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
103	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
104	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
105	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
106	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
107	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
108	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
109	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
110	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
111	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
112	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
113	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
114	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
115	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
116	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
117	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
118	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
119	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
120	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
121	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
122	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
123	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
124	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
125	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
126	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
127	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
128	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
129	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
130	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
131	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
132	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
133	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
134	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
135	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
136	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
137	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
138	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
139	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
140	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
141	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
142	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
143	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
144	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
145	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
146	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
147	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
148	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
149	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
150	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
151	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
152	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
153	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
154	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
155	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
156	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
157	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
158	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
159	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
160	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
161	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
162	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
163	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
164	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
165	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
166	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
167	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
168	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
169	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
170	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
171	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
172	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
173	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
174	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
175	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
176	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
177	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
178	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
179	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
180	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
181	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
182	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
183	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
184	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
185	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
186	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
187	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
188	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
189	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
190	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
191	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
192	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
193	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
194	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
195	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
196	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
197	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
198	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
199	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
200	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
201	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
202	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
203	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
204	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
205	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
206	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
207	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
208	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
209	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
210	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
211	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
212	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
213	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
214	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
215	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
216	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
217	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
218	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
219	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
220	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
221	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
222	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
223	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
224	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
270	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
225	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
226	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
227	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
228	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
229	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
230	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
231	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
232	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
233	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
234	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
235	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
236	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
237	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
238	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
239	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
240	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
241	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
242	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
243	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
244	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
245	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
246	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
247	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
248	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
249	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
250	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
251	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
252	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
253	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
254	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
255	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
256	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
257	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
258	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
259	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
260	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
261	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
262	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
263	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
264	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
265	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
266	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
267	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
268	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
269	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
271	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
272	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
273	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
274	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
275	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
276	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
277	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
278	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
279	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
280	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
281	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
282	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
283	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
284	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
285	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
286	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
287	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
288	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
289	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
290	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
291	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
292	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
293	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
294	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
295	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
296	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
297	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
298	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
299	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
300	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
301	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
302	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
303	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
304	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
305	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
306	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
307	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
308	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
309	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
310	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
311	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
312	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
313	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
314	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
315	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
316	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
317	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
318	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
319	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
320	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
321	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
322	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
323	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
324	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
325	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
326	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
327	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
328	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
329	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
330	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
331	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
332	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
333	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
334	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
335	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
336	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
337	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
338	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
339	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
340	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
341	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
342	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
343	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
344	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
345	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
346	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
347	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
348	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
349	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
350	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
351	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
352	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
353	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
354	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
355	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
356	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
357	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
358	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
359	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
360	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
361	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
362	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
363	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
364	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
365	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
366	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
367	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
368	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
369	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
370	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
371	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
372	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
373	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
374	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
375	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
376	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
377	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
378	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
379	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
380	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
381	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
382	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
383	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
384	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
385	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
386	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
387	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
388	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
389	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
390	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
391	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
392	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
393	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
394	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
395	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
396	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
397	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
398	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
399	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
400	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
401	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
402	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
403	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
404	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
450	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
405	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
406	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
407	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
408	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
409	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
410	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
411	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
412	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
413	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
414	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
415	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
416	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
417	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
418	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
419	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
420	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
421	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
422	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
423	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
424	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
425	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
426	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
427	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
428	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
429	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
430	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
431	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
432	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
433	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
434	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
435	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
436	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
437	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
438	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
439	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
440	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
441	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
442	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
443	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
444	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
445	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
446	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
447	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
448	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
449	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
451	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
452	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
453	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
454	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
455	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
456	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
457	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
458	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
459	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
460	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
461	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
462	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
463	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
464	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
465	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
466	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
467	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
468	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
469	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
470	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
471	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
472	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
473	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
474	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
475	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
476	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
477	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
478	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
479	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
480	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
481	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
482	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
483	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
484	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
485	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
486	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
487	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
488	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
489	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
490	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
491	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
492	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
493	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
494	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
495	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
496	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
497	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
498	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
499	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
500	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
501	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
502	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
503	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
504	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
505	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
506	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
507	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
508	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
509	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
510	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
511	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
512	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
513	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
514	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
515	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
516	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
517	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
518	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
519	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
520	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
521	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
522	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
523	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
524	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
525	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
526	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
527	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
528	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
529	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
530	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
531	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
532	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
533	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
534	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
535	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
536	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
537	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
538	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
539	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
540	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
541	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
542	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
543	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
544	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
545	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
546	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
547	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
548	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
549	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
550	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
551	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
552	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
553	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
554	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
555	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
556	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
557	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
558	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
559	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
560	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
561	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
562	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
563	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
564	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
565	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
566	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
567	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
568	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
569	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
570	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
571	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
572	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
573	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
574	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
575	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
576	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
577	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
578	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
579	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
580	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
581	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
582	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
583	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
584	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
585	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
586	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
587	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
588	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
589	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
590	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
591	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
592	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
593	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
594	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
595	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
596	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
597	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
598	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
599	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
600	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
601	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
602	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
603	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
604	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
605	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
606	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
607	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
608	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
609	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
610	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
611	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
612	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
613	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
614	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
615	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
616	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
617	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
618	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
619	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
620	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
621	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
622	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
623	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
624	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
625	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
626	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
627	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
628	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
629	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
630	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
631	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
632	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
633	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
634	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
635	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
636	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
637	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
638	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
639	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
640	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
641	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
642	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
643	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
644	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
645	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
646	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
647	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
648	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
649	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
650	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
651	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
652	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
653	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
654	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
655	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
656	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
657	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
658	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
659	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
660	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
661	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
662	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
663	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
664	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
665	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
666	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
667	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
668	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
669	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
670	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
671	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
672	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
673	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
674	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
675	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
676	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
677	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
678	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
679	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
680	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
681	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
682	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
683	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
684	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
685	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
686	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
687	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
688	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
689	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
690	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
691	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
692	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
693	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
694	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
695	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
696	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
697	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
698	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
699	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
700	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
701	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
702	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
703	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
704	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
705	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
706	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
707	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
708	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
709	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
710	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
711	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
712	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
713	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
714	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
715	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
716	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
717	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
718	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
719	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
720	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
721	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
722	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
723	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
724	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
725	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
726	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
727	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
728	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
729	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
730	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
731	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
732	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
733	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
734	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
735	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
736	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
737	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
738	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
739	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
740	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
741	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
742	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
743	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
744	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
745	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
746	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
747	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
748	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
749	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
750	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
751	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
752	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
753	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
754	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
755	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
756	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
757	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
758	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
759	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
760	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
761	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
762	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
763	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
764	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
810	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
765	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
766	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
767	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
768	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
769	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
770	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
771	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
772	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
773	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
774	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
775	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
776	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
777	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
778	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
779	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
780	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
781	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
782	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
783	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
784	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
785	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
786	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
787	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
788	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
789	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
790	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
791	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
792	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
793	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
794	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
795	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
796	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
797	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
798	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
799	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
800	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
801	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
802	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
803	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
804	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
805	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
806	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
807	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
808	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
809	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
811	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
812	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
813	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
814	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
815	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
816	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
817	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
818	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
819	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
820	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
821	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
822	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
823	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
824	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
825	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
826	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
827	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
828	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
829	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
830	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
831	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
832	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
833	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
834	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
835	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
836	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
837	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
838	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
839	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
840	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
841	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
842	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
843	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
844	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
845	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
846	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
847	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
848	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
849	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
850	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
851	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
852	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
853	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
854	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
855	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
856	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
857	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
858	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
859	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
860	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
861	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
862	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
863	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
864	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
865	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
866	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
867	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
868	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
869	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
870	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
871	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
872	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
873	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
874	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
875	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
876	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
877	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
878	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
879	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
880	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
881	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
882	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
883	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
884	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
885	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
886	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
887	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
888	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
889	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
890	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
891	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
892	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
893	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
894	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
895	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
896	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
897	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
898	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
899	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
900	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
901	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
902	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
903	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
904	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
905	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
906	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
907	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
908	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
909	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
910	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
911	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
912	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
913	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
914	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
915	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
916	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
917	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
918	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
919	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
920	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
921	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
922	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
923	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
924	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
925	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
926	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
927	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
928	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
929	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
930	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
931	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
932	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
933	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
934	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
935	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
936	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
937	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
938	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
939	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
940	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
941	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
942	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
943	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
944	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
990	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
945	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
946	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
947	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
948	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
949	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
950	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
951	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
952	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
953	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
954	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
955	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
956	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
957	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
958	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
959	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
960	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
961	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
962	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
963	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
964	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
965	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
966	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
967	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
968	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
969	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
970	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
971	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
972	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
973	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
974	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
975	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
976	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
977	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
978	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
979	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
980	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
981	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
982	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
983	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
984	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
985	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
986	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
987	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
988	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
989	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
991	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
992	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
993	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
994	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
995	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
996	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
997	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
998	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
999	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1000	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1001	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1002	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1003	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1004	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1005	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1006	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1007	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1008	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1009	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1010	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1011	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1012	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1013	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1014	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1015	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1016	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1017	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1018	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1019	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1020	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1021	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1022	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1023	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1024	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1025	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1026	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1027	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1028	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1029	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1030	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1031	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1032	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1033	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1034	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1035	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1036	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1037	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1038	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1039	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1040	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1041	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1042	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1043	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1044	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1045	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1046	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1047	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1048	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1049	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1050	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1051	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1052	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1053	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1054	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1055	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1056	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1057	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1058	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1059	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1060	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1061	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1062	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1063	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1064	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1065	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1066	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1067	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1068	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1069	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1070	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1071	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1072	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1073	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1074	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1075	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1076	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1077	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1078	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1079	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1080	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1081	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1082	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1083	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1084	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1085	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1086	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1087	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1088	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1089	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1090	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1091	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1092	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1093	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1094	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1095	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1096	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1097	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1098	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1099	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1100	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1101	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1102	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1103	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1104	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1105	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1106	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1107	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1108	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1109	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1110	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1111	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1112	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1113	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1114	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1115	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1116	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1117	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1118	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1119	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1120	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1121	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1122	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1123	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1124	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1125	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1126	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1127	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1128	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1129	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1130	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1131	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1132	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1133	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1134	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1135	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1136	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1137	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1138	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1139	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1140	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
1141	Main Office - Devaryamjal	office	\N	Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1142	Plant - Devaryamjal 659 & 661	storage	\N	Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1143	Prabhavati Seeds - Devaryamjal	storage	\N	Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1144	Sri Sai Harsha Seeds - Devaryamjal	storage	\N	Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078	t
1145	GNR Cold Storage - Raj Bollaram	cold_storage	\N	Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1146	Gubba Cold Storage - Yellampet 85/b	cold_storage	\N	Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1147	Gubba Cold Storage - IDA Medchal 109	cold_storage	\N	Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1148	Gubbs Green Cold - Athevelli 151	cold_storage	\N	Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1149	Gubba Cold Storage - Athevelli 150	cold_storage	\N	Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401	t
1150	Gubba Cold Storage - IDA Medchal 101	cold_storage	\N	Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1151	Gubba Cold Storage - Yellampet 84	cold_storage	\N	Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401	t
1152	Gubba Cold Storage - Kandlakoya	cold_storage	\N	Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401	t
1153	Thrimural Thirupathi Agro Cold Storage - IDA Medchal	cold_storage	\N	Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401	t
1154	Himalaya Cold Storage - Somaram	cold_storage	\N	Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401	t
1155	Soni Biogene - Kompally	storage	\N	2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014	t
1156	Ayyan Seeds - Gundlapochampalli	storage	\N	Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401	t
1157	PACS Utoor - Karimnagar	storage	\N	2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505	t
1158	GMR Hi Technology Seeds - Pachchunur	storage	\N	Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505	t
1159	Vinayaka Seeds & Farms - Pachchunur	storage	\N	Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469	t
1160	Patti Toopran - Medak	storage	\N	Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334	t
\.


--
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lots (id, lot_number, product_id, source_type, source_reference_id, source_name, initial_quantity, quantity_unit, stock_form, status, inward_date, expiry_date, remarks, created_by, created_at) FROM stdin;
3	R2514004RKS	1177	inward	\N	Renuka Seeds	150	kg	loose	active	2026-03-06	2026-11-05	brought by gopi	\N	2026-03-12 08:44:27.896073
4	K253001KRR	72	inward	\N	Kurnool	503	kg	loose	active	2026-03-03	2026-11-02	ok	\N	2026-03-13 06:20:07.758198
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, message, employee_id, employee_name, resource_type, resource_id, is_read, created_at) FROM stdin;
1	punch_in	Katta Gopi punched in at 09:29	3	Katta Gopi	\N	\N	t	2026-03-12 03:59:11.469166
3	punch_in	Mudunuri Swathi punched in at 09:45	18	Mudunuri Swathi	\N	\N	t	2026-03-12 04:15:23.780962
4	punch_in	Guna Shekar punched in at 09:55	28	Guna Shekar	\N	\N	t	2026-03-12 04:25:13.934776
2	punch_in	Bolli Divya punched in at 09:36	17	Bolli Divya	\N	\N	t	2026-03-12 04:06:59.304319
5	punch_in	Ravikumar Yedumula punched in at 10:11	37	Ravikumar Yedumula	\N	\N	t	2026-03-12 04:41:25.880461
6	punch_out	Katta Gopi punched out at 10:28	3	Katta Gopi	\N	\N	t	2026-03-12 04:58:04.469238
7	trip_start	V. Prathap Reddy started a trip	1	V. Prathap Reddy	\N	\N	t	2026-03-12 09:27:13.783584
8	trip_end	V. Prathap Reddy submitted trip for approval (0 km)	1	V. Prathap Reddy	\N	\N	t	2026-03-12 09:28:41.677483
10	punch_in	Bolli Divya punched in at 09:20 from Shamirpet mandal, Medchal mandal, Telangana	17	Bolli Divya	\N	\N	t	2026-03-13 03:50:48.120871
11	punch_in	Mudunuri Swathi punched in at 09:21	18	Mudunuri Swathi	\N	\N	t	2026-03-13 03:51:34.706101
9	punch_in	Katta Gopi punched in at 09:19	3	Katta Gopi	\N	\N	t	2026-03-13 03:49:29.77668
12	punch_in	Guna Shekar punched in at 09:25	28	Guna Shekar	\N	\N	t	2026-03-13 03:55:45.276795
13	punch_out	Guna Shekar punched out at 19:27	28	Guna Shekar	\N	\N	t	2026-03-13 13:57:39.078875
\.


--
-- Data for Name: outward_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outward_records (id, lot_id, location_id, stock_form, packet_size, quantity, destination_type, destination_name, variety, invoice_number, vehicle_number, dispatch_date, dispatched_by, driver_name, remarks, created_by, created_at) FROM stdin;
2	3	1	packed	250 g	5	TS	sri laxminarsimha swamy	Ridhika	2302	TSJQ2727	2026-03-13	By krupakar sir	\N	\N	\N	2026-03-13 05:36:57.24778
3	3	1	packed	250 g	5	TS	shiva fertilizer kukunurpally	Ridhika	2303	TSJQ2727	2026-03-13	by gopi to kranthi	\N	\N	\N	2026-03-13 05:55:21.440622
4	4	1	packed	100 g	10	TS	reddy  fertilizer	RISHI-111	4098	TG06AL6308	2026-03-13	by gopi to kranthi	\N	\N	\N	2026-03-13 08:48:09.441016
5	4	1	packed	500 g	5	TS	reddy  fertilizer	RISHI-111	4098	TG06AL6308	2026-03-13	By gopi to kranthi	\N	\N	\N	2026-03-13 08:57:57.130466
6	4	1	packed	250 g	10	TS	ARSKToopran	RISHI-111	4099	To plant	2026-03-13	By krupakar sir	\N	\N	\N	2026-03-13 09:04:32.63418
7	4	1	packed	500 g	10	TS	ARSKToopran	RISHI-111	4099	To plant	2026-03-13	By krupakar sir	\N	\N	\N	2026-03-13 09:07:15.231197
8	4	1	packed	250 g	10	TS	Haca service centre amberpet	RISHI-111	4100	TS08JQ2727	2026-03-13	By krupakar sir to plant	\N	\N	\N	2026-03-13 09:12:29.167961
\.


--
-- Data for Name: packaging_outputs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.packaging_outputs (id, batch_id, lot_id, location_id, packaging_size_id, packet_size, number_of_packets, total_quantity_kg, waste_quantity, production_date, packed_by, remarks, created_by, created_at) FROM stdin;
3	\N	3	1	12	250 g	20	5	0.01	2026-03-13	divya	ok	\N	2026-03-13 04:43:53.283481
4	\N	3	1	12	250 g	20	5	0.01	2026-03-13	divya	ok	\N	2026-03-13 05:51:12.691819
5	\N	4	1	5	100 g	100	10	0.01	2026-03-13	swathi	ok	\N	2026-03-13 08:44:07.774055
6	\N	4	1	13	500 g	10	5	0.01	2026-03-13	swathi	ok	\N	2026-03-13 08:55:44.453237
7	\N	4	1	12	250 g	40	10	0.01	2026-03-13	swathi	ok	\N	2026-03-13 09:02:07.032208
8	\N	4	1	13	500 g	20	10	0.01	2026-03-13	swathi	ok	\N	2026-03-13 09:06:08.844296
9	\N	4	1	12	250 g	40	10	0.01	2026-03-13	swathi	ok	\N	2026-03-13 09:10:15.531619
\.


--
-- Data for Name: packaging_sizes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.packaging_sizes (id, size, unit, label, is_active, created_at) FROM stdin;
1	10	Kg	10 Kg	t	2026-03-12 05:28:00.351655
2	20	Kg	20 Kg	t	2026-03-12 05:28:17.604865
3	30	Kg	30 Kg	t	2026-03-12 05:28:23.563728
4	50	Kg	50 Kg	t	2026-03-12 05:28:31.313057
5	100	g	100 g	t	2026-03-12 05:29:18.825788
6	10	g	10 g	t	2026-03-12 05:29:51.717988
7	50	g	50 g	t	2026-03-12 05:30:00.570934
8	2	g	2 g	t	2026-03-12 05:30:15.41179
9	25	g	25 g	t	2026-03-12 05:30:23.926204
10	25	Kg	25 Kg	t	2026-03-12 05:30:29.883204
11	100	Kg	100 Kg	t	2026-03-12 05:30:36.71642
12	250	g	250 g	t	2026-03-12 05:31:09.804284
13	500	g	500 g	t	2026-03-12 05:31:22.626098
14	5	Kg	5 Kg	t	2026-03-13 04:42:21.045757
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payrolls (id, employee_id, month, total_days, present_days, basic_pay, allowances, overtime_amount, deductions, net_salary, status, generated_date) FROM stdin;
1	1	2026-03	30	30	44568	61853	0	0	106421	generated	2026-03-12
2	2	2026-03	30	30	44575	61663	0	0	106238	generated	2026-03-12
3	25	2026-03	30	30	7200	10800	0	0	18000	generated	2026-03-12
4	29	2026-03	30	30	8800	13200	0	0	22000	generated	2026-03-12
5	34	2026-03	30	30	6400	9600	0	0	16000	generated	2026-03-12
6	3	2026-03	30	30	11000	11755	0	0	22755	generated	2026-03-12
7	5	2026-03	30	30	12760	14661	0	0	27421	generated	2026-03-12
8	6	2026-03	30	30	11000	12813	0	0	23813	generated	2026-03-12
9	7	2026-03	30	30	12000	18000	0	0	30000	generated	2026-03-12
10	9	2026-03	30	30	22464	25462	0	0	47926	generated	2026-03-12
11	10	2026-03	30	30	12320	14430	0	0	26750	generated	2026-03-12
12	11	2026-03	30	30	8800	9894	0	0	18694	generated	2026-03-12
13	24	2026-03	30	30	7200	10800	0	0	18000	generated	2026-03-12
14	12	2026-03	30	30	6560	7336	0	0	13896	generated	2026-03-12
15	14	2026-03	30	30	6760	7511	0	0	14271	generated	2026-03-12
16	15	2026-03	30	30	24000	34300	0	0	58300	generated	2026-03-12
17	16	2026-03	30	30	3600	5400	0	0	9000	generated	2026-03-12
18	17	2026-03	30	30	6800	10200	0	0	17000	generated	2026-03-12
19	18	2026-03	30	30	6000	9000	0	0	15000	generated	2026-03-12
20	19	2026-03	30	30	12400	18600	0	0	31000	generated	2026-03-12
21	21	2026-03	30	30	6000	9000	0	0	15000	generated	2026-03-12
22	20	2026-03	30	30	9600	14400	0	0	24000	generated	2026-03-12
23	22	2026-03	30	30	6000	9000	0	0	15000	generated	2026-03-12
24	23	2026-03	30	30	6400	9600	0	0	16000	generated	2026-03-12
25	13	2026-03	30	30	7176	7885	0	0	15061	generated	2026-03-12
26	28	2026-03	30	30	6800	10200	0	0	17000	generated	2026-03-12
27	30	2026-03	30	30	16000	24000	0	0	40000	generated	2026-03-12
28	33	2026-03	30	30	7600	11400	0	0	19000	generated	2026-03-12
29	37	2026-03	30	30	11000	16450	0	2840	24610	generated	2026-03-12
30	35	2026-03	30	30	8480	12720	0	0	21200	generated	2026-03-12
31	36	2026-03	30	30	7200	10800	0	0	18000	generated	2026-03-12
32	26	2026-03	30	30	6400	9600	0	0	16000	generated	2026-03-12
33	27	2026-03	30	30	7200	10800	0	0	18000	generated	2026-03-12
34	31	2026-03	30	30	7000	10500	0	0	17500	generated	2026-03-12
35	32	2026-03	30	30	8800	13200	0	0	22000	generated	2026-03-12
36	8	2026-03	30	30	10920	16380	0	0	27300	generated	2026-03-12
37	4	2026-03	30	30	12320	14122	0	0	26442	generated	2026-03-12
\.


--
-- Data for Name: processing_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processing_records (id, input_lot_id, input_quantity, output_lot_id, output_quantity, waste_quantity, processing_type, processing_date, processed_by, remarks, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, crop, variety, type, is_active, created_at) FROM stdin;
1	Tomato	ARKA VIKAS	notified	t	2026-03-11 06:47:14.160554
2	Tomato	S-22	notified	t	2026-03-11 06:47:14.202205
3	Brinjal	BHAGYAMATI	notified	t	2026-03-11 06:47:14.223014
4	Brinjal	Gulabi	notified	t	2026-03-11 06:47:14.243961
5	Brinjal	Syamala	notified	t	2026-03-11 06:47:14.26576
6	Brinjal	PPL	notified	t	2026-03-11 06:47:14.286573
7	Bhendi	ARKA ANAMIKA	notified	t	2026-03-11 06:47:14.30826
8	Chilli	PUSA JWALA	notified	t	2026-03-11 06:47:14.329465
9	Paddy	BPT-5204 (SAMBA MASURI)	notified	t	2026-03-11 06:47:14.350387
10	Paddy	MTU-1010	notified	t	2026-03-11 06:47:14.371348
11	Paddy	TELLA HAMSA	notified	t	2026-03-11 06:47:14.392673
12	Paddy	RNR-15048 (TELANGANA SONA)	notified	t	2026-03-11 06:47:14.413959
14	Bottle Gourd	PSPL	notified	t	2026-03-11 06:47:14.455448
17	Ridge Gourd	JAIPUR LONG	notified	t	2026-03-11 06:47:14.517604
18	Snake Gourd	SWETHA	notified	t	2026-03-11 06:47:14.539748
19	Amaranthus	RNA 1	notified	t	2026-03-11 06:47:14.560545
20	Cluster Bean	PUSA NAVBAHAR	notified	t	2026-03-11 06:47:14.581335
21	Dolichos Bean	PUSA EARLY PROLIFIC	notified	t	2026-03-11 06:47:14.60203
22	Dolichos Bean	RND-1	notified	t	2026-03-11 06:47:14.623054
23	Spinach	ALL GREEN	notified	t	2026-03-11 06:47:14.643883
24	Cowpea	PUSA KOMAL	notified	t	2026-03-11 06:47:14.664829
25	Black Gram	T-9	notified	t	2026-03-11 06:47:14.685515
26	Red Gram	ICPL-85063 (LAXMI)	notified	t	2026-03-11 06:47:14.705977
27	Coriander	CS 4	notified	t	2026-03-11 06:47:14.726651
28	MAIZE	RCH-111 (MH-2601)	notified	t	2026-03-11 06:47:14.746956
29	MAIZE	RCH-222 (MH-2602)	notified	t	2026-03-11 06:47:14.768009
30	MAIZE	RCH-333 (MH-2603)	notified	t	2026-03-11 06:47:14.788331
31	MAIZE	RCH-444 (MH-2604)	notified	t	2026-03-11 06:47:14.809062
32	MAIZE	RCH-555 (MH-2605)	notified	t	2026-03-11 06:47:14.829612
33	MAIZE	RCH-666 (MH-2606)	notified	t	2026-03-11 06:47:14.850517
34	MAIZE	RCH-777 (MH-2607)	notified	t	2026-03-11 06:47:14.870951
35	MAIZE	RCH-888 (MH-2608)	notified	t	2026-03-11 06:47:14.891547
36	MAIZE	RCH-999 (MH-2609)	notified	t	2026-03-11 06:47:14.911786
37	MAIZE	RCH-010 (MH-2610)	notified	t	2026-03-11 06:47:14.931862
38	PADDY	RCH-101	notified	t	2026-03-11 06:47:14.952222
39	PADDY	RCH-202	notified	t	2026-03-11 06:47:14.97272
40	PADDY	RCH-303	notified	t	2026-03-11 06:47:14.993322
41	COTTON	RCH-GOLD	notified	t	2026-03-11 06:47:15.014197
42	COTTON	RCH-SILVER	notified	t	2026-03-11 06:47:15.034906
43	COTTON	RCH-PLATINUM	notified	t	2026-03-11 06:47:15.055278
44	Maize	RISHI-11	private_research	t	2026-03-11 06:47:15.075642
45	Maize	RISHI-22	private_research	t	2026-03-11 06:47:15.096855
46	Maize	RISHI-33	private_research	t	2026-03-11 06:47:15.117195
47	Maize	RISHI-44	private_research	t	2026-03-11 06:47:15.137489
48	Maize	RISHI-55	private_research	t	2026-03-11 06:47:15.158074
49	Maize	RISHI-66	private_research	t	2026-03-11 06:47:15.178603
50	Bitter Gourd	RISHI-18	private_research	t	2026-03-11 06:47:15.199454
51	Bitter Gourd	APSARA	private_research	t	2026-03-11 06:47:15.220028
53	Bottle Gourd	REKHA	private_research	t	2026-03-11 06:47:15.261073
54	Cucumber	HARINI	private_research	t	2026-03-11 06:47:15.281758
55	Ridge Gourd	RHR-786	private_research	t	2026-03-11 06:47:15.30277
56	Watermelon	RISHI-5	private_research	t	2026-03-11 06:47:15.324147
57	Watermelon	HIMABINDU	private_research	t	2026-03-11 06:47:15.345121
58	Bhendi	RHB-101	private_research	t	2026-03-11 06:47:15.365519
59	Bhendi	JOSH	private_research	t	2026-03-11 06:47:15.386345
60	Bhendi	NEHA	private_research	t	2026-03-11 06:47:15.406527
61	Chilli	YAGNA	private_research	t	2026-03-11 06:47:15.426732
62	Chilli	GREESHMA	private_research	t	2026-03-11 06:47:15.446951
63	Chilli	RHC-623	private_research	t	2026-03-11 06:47:15.467135
64	Chilli	RHC-633	private_research	t	2026-03-11 06:47:15.487144
65	Chilli	RHC-613	private_research	t	2026-03-11 06:47:15.507191
66	Chilli	RHC-678	private_research	t	2026-03-11 06:47:15.52719
67	Tomato	RHT-900	private_research	t	2026-03-11 06:47:15.5472
68	Tomato	RHT-910	private_research	t	2026-03-11 06:47:15.567243
69	Tomato	RHT-918	private_research	t	2026-03-11 06:47:15.587234
70	Tomato	RHT-990	private_research	t	2026-03-11 06:47:15.607897
71	Tomato	RHT-550	private_research	t	2026-03-11 06:47:15.628462
72	Cluster Bean	RISHI-111	private_research	t	2026-03-11 06:47:15.648603
73	Dolichos Bean	RDS-222	private_research	t	2026-03-11 06:47:15.669407
74	Dolichos Bean	RDS-333	private_research	t	2026-03-11 06:47:15.689951
75	Bajra	RISHI-555	private_research	t	2026-03-11 06:47:15.710396
76	Jowar	RSH-20	private_research	t	2026-03-11 06:47:15.731337
77	Castor	RHC-09	private_research	t	2026-03-11 06:47:15.751868
78	Castor	RHC-19	private_research	t	2026-03-11 06:47:15.772489
79	Red Gram	ARUN	private_research	t	2026-03-11 06:47:15.792967
80	Sunflower	RHS-117	private_research	t	2026-03-11 06:47:15.814267
81	Sunflower	RHS-118	private_research	t	2026-03-11 06:47:15.834849
82	Paddy	NANDIKA-55	private_research	t	2026-03-11 06:47:15.855288
1163	Ridge gourd	navya	private_research	t	2026-03-12 07:33:04.605561
1166	Tomato	RHT 550	private_research	t	2026-03-12 07:34:02.569119
1167	Tomato	Jaihoo	private_research	t	2026-03-12 07:34:26.742215
1168	Tomato	Divya	private_research	t	2026-03-12 07:34:41.990578
1169	Sponge gourd	Hema	private_research	t	2026-03-12 07:34:58.887023
1170	Watermelon	Hima Bindhu	private_research	t	2026-03-12 07:35:35.359079
1171	Watermelon	Solider	private_research	t	2026-03-12 07:35:55.732109
1173	Bitter Gourd	Rishi 27	private_research	t	2026-03-12 07:36:42.641186
1174	Bitter gourd	Rishi 18	private_research	t	2026-03-12 07:37:02.376291
16	Cucumber	Harini	private_research	t	2026-03-11 06:47:14.496728
1175	Cowpea 	Keerthi	private_research	t	2026-03-12 07:37:54.318716
1176	Bottle Gourd 	Swetha	private_research	t	2026-03-12 07:38:36.960835
1164	pumpkin	Rishi-14	private_research	t	2026-03-12 07:33:21.997041
1172	Bitter Gourd	Rishi 2325	private_research	t	2026-03-12 07:36:18.733175
1177	Bhendi 	Ridhika	private_research	t	2026-03-12 08:38:01.932719
1190	Bitter Gourd	GREEN LONG	notified	t	2026-03-12 08:40:30.136068
1193	Cucumber	YELLOW ROUND	notified	t	2026-03-12 08:40:30.199576
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, permissions, is_active, created_at) FROM stdin;
1	Managing Director	Full access to all modules	{"lots": ["view", "create", "edit", "delete"], "stock": ["view", "create", "edit", "delete"], "users": ["view", "create", "edit", "delete"], "batches": ["view", "create", "edit", "delete"], "outward": ["view", "create", "edit", "delete"], "payroll": ["view", "create", "edit", "delete"], "reports": ["view"], "products": ["view", "create", "edit", "delete"], "dashboard": ["view"], "employees": ["view", "create", "edit", "delete"], "locations": ["view", "create", "edit", "delete"], "packaging": ["view", "create", "edit", "delete"], "attendance": ["view", "create", "edit", "delete"], "processing": ["view", "create", "edit", "delete"], "packagingSizes": ["view", "create", "edit", "delete"]}	t	2026-03-11 06:47:16.35729
2	Adm Plant	Plant administration with full operational access	{"lots": ["view", "create", "edit"], "stock": ["view", "create", "edit"], "users": [], "batches": ["view", "create", "edit"], "outward": ["view", "create", "edit"], "payroll": ["view"], "reports": ["view"], "products": ["view", "create", "edit"], "dashboard": ["view"], "employees": ["view", "create", "edit"], "locations": ["view", "create", "edit"], "packaging": ["view", "create", "edit"], "attendance": ["view", "create", "edit"], "processing": ["view", "create", "edit"], "packagingSizes": ["view", "create", "edit"]}	t	2026-03-11 06:47:16.39045
4	Auditor	Read-only audit access to all modules	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": ["view"], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": ["view"], "locations": ["view"], "packaging": ["view"], "attendance": ["view"], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.432521
5	Plant Quality Executive	Quality control and inspection	{"lots": ["view", "create", "edit"], "stock": ["view", "create", "edit"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create", "edit"], "attendance": [], "processing": ["view", "create", "edit"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.453587
6	Plant SR. Production	Senior production management	{"lots": ["view", "create", "edit"], "stock": ["view", "create", "edit"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create", "edit"], "attendance": [], "processing": ["view", "create", "edit"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.474903
7	Processing & Packing Incharge	Processing and packing operations management	{"lots": ["view", "create", "edit"], "stock": ["view", "create", "edit"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create", "edit"], "attendance": [], "processing": ["view", "create", "edit"], "packagingSizes": ["view", "create"]}	t	2026-03-11 06:47:16.49565
8	Plant Operator	Plant production operations	{"lots": ["view", "create"], "stock": ["view", "create"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create"], "attendance": [], "processing": ["view", "create"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.516746
9	Production	Production department operations	{"lots": ["view", "create", "edit"], "stock": ["view", "create", "edit"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create", "edit"], "attendance": [], "processing": ["view", "create", "edit"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.537333
10	Veg Packing Incharge	Vegetable seed packing operations	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view", "create", "edit"], "attendance": [], "processing": ["view"], "packagingSizes": ["view", "create"]}	t	2026-03-11 06:47:16.557801
11	PO (Research Associate)	Research and product development	{"lots": ["view", "create"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view"], "payroll": [], "reports": ["view"], "products": ["view", "create", "edit"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view", "create"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.586537
12	Plant RM	Regional Manager - sales territory management	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create", "edit"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.606734
13	Plant TSM	Territory Sales Manager	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create", "edit"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.626803
14	Plant ASM	Area Sales Manager	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create", "edit"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.646759
15	Plant Sales Officer	Sales operations at plant level	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create", "edit"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.667183
16	Plant Sales	Sales operations	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.689487
17	Plant SEM	Sales Executive Manager	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.710352
18	Plant SO	Sales Officer	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.731066
19	Sales Officer	Field sales officer	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create", "edit"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.751308
20	Sales	Sales team member	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.771517
21	Field Associate	Field operations and farmer coordination	{"lots": ["view"], "stock": ["view"], "users": [], "batches": ["view"], "outward": ["view", "create"], "payroll": [], "reports": ["view"], "products": ["view"], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": ["view"], "attendance": [], "processing": ["view"], "packagingSizes": ["view"]}	t	2026-03-11 06:47:16.791883
22	Driver	Transport and logistics	{"lots": ["view"], "stock": ["view"], "users": [], "batches": [], "outward": ["view"], "payroll": [], "reports": [], "products": [], "dashboard": ["view"], "employees": [], "locations": ["view"], "packaging": [], "attendance": [], "processing": [], "packagingSizes": []}	t	2026-03-11 06:47:16.812035
3	Plant Accounts	Plant accounts and financial operations	{"lots": ["view", "create", "edit", "delete"], "stock": ["view", "create", "edit", "delete"], "users": ["view", "create", "edit", "delete"], "batches": ["view", "create", "edit", "delete"], "outward": ["view", "create", "edit", "delete"], "payroll": ["view", "create", "edit", "delete"], "reports": ["view", "create", "edit", "delete"], "products": ["view", "create", "edit", "delete"], "dashboard": ["view", "create", "edit", "delete"], "employees": ["view", "create", "edit", "delete"], "locations": ["view", "create", "edit", "delete"], "packaging": ["view", "create", "edit", "delete"], "attendance": ["view", "create", "edit", "delete"], "processing": ["view", "create", "edit", "delete"], "packagingSizes": ["view", "delete", "edit", "create"]}	t	2026-03-11 06:47:16.41168
\.


--
-- Data for Name: stock_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_balances (id, lot_id, location_id, stock_form, packet_size, quantity, last_updated) FROM stdin;
1	1	12	loose	\N	350	2026-03-12 05:25:40.444
3	1	1	packed	100 g	100	2026-03-12 05:33:13.385821
5	2	6	loose	\N	200	2026-03-12 08:44:06.947188
4	2	3	loose	\N	489.99	2026-03-12 08:45:07.663
7	2	3	packed	10 Kg	1	2026-03-12 08:45:07.735513
8	1	5	cs_inward	\N	503	2026-03-12 10:29:21.917772
9	1	2	loose	\N	0	2026-03-12 10:29:21.916034
10	1	5	cs_outward	\N	153	2026-03-12 10:29:21.928072
2	1	1	loose	\N	153	2026-03-12 10:29:21.917
14	3	1	packed	250 g	0	2026-03-13 05:55:21.504
15	4	12	loose	\N	350	2026-03-13 06:35:14.638
17	4	5	cs_outward	\N	153	2026-03-13 06:58:08.396
16	4	5	cs_inward	\N	503	2026-03-13 06:58:08.406
18	4	2	loose	\N	0	2026-03-13 06:58:08.42
13	3	5	cs_outward	\N	0	2026-03-13 07:30:39.284
12	3	2	loose	\N	0	2026-03-13 07:30:39.286
6	3	1	loose	\N	139.98000000000002	2026-03-13 07:30:39.291
11	3	5	cs_inward	\N	0	2026-03-13 07:30:39.302
20	4	1	packed	100 g	0	2026-03-13 08:48:09.482
21	4	1	packed	500 g	0	2026-03-13 09:07:15.264
19	4	1	loose	\N	107.95	2026-03-13 09:10:15.567
22	4	1	packed	250 g	0	2026-03-13 09:12:29.202
\.


--
-- Data for Name: stock_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_entries (id, batch_id, location_id, quantity, entry_date, responsible_person, created_at) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_movements (id, batch_id, lot_id, from_location_id, to_location_id, quantity, stock_form, movement_date, responsible_person, remarks, created_by, created_at) FROM stdin;
3	\N	4	12	1	153	\N	2026-03-13	brought by     gopi	ok	\N	2026-03-13 06:35:14.718096
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_comments (id, task_id, message, created_by_name, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, task_code, title, employee_db_id, customer_name, customer_address, work_location, priority, status, stage, type, start_date, end_date, started_at, completed_at, created_by_name, notes, check_in_latitude, check_in_longitude, check_in_location_name, check_in_time, check_in_photo, created_at) FROM stdin;
\.


--
-- Data for Name: trip_audit_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_audit_history (id, trip_id, from_status, to_status, changed_by_name, notes, changed_at) FROM stdin;
1	1	submitted	approved	System Administrator	Trip approved	2026-03-12 09:37:12.487824
\.


--
-- Data for Name: trip_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_comments (id, trip_id, message, created_by_name, created_at) FROM stdin;
\.


--
-- Data for Name: trip_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_visits (id, trip_id, punch_in_time, punch_out_time, punch_in_latitude, punch_in_longitude, punch_in_location_name, punch_out_latitude, punch_out_longitude, punch_out_location_name, punch_in_photo, punch_out_photo, status, remarks, created_at, customer_name, customer_address) FROM stdin;
1	1	2026-03-12 09:27:58.549	2026-03-12 09:28:19.425	12.8727932	77.65766	\N	12.8727859	77.6576554	\N	/uploads/1773307678522-397135387.jpg	/uploads/1773307699395-28177282.jpg	completed	Hi	2026-03-12 09:27:58.559504	Malothra pvt ltd	Hsjsjsjs
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips (id, employee_id, status, start_time, end_time, start_latitude, start_longitude, start_location_name, end_latitude, end_longitude, end_location_name, start_meter_photo, end_meter_photo, start_meter_reading, end_meter_reading, total_km, expense_amount, rejection_reason, approved_by, approved_at, created_at) FROM stdin;
1	1	approved	2026-03-12 09:27:13.722	2026-03-12 09:28:41.625	12.872799	77.6576581	\N	12.8727956	77.6576565	\N	/uploads/1773307633713-311725281.jpg	/uploads/1773307721462-888716639.jpg	100	15	0	\N	\N	1	2026-03-12 09:37:12.453	2026-03-12 09:27:13.73452
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, full_name, created_at) FROM stdin;
1	admin	admin123	admin	System Administrator	2026-03-11 06:47:14.126864
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: -
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 2, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 9, true);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.batches_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: dryer_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dryer_entries_id_seq', 12, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 38, true);


--
-- Name: expense_audit_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_audit_history_id_seq', 1, false);


--
-- Name: expense_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_comments_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 1160, true);


--
-- Name: lots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lots_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 13, true);


--
-- Name: outward_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outward_records_id_seq', 8, true);


--
-- Name: packaging_outputs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.packaging_outputs_id_seq', 9, true);


--
-- Name: packaging_sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.packaging_sizes_id_seq', 14, true);


--
-- Name: payrolls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payrolls_id_seq', 37, true);


--
-- Name: processing_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.processing_records_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 4829, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 22, true);


--
-- Name: stock_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_balances_id_seq', 22, true);


--
-- Name: stock_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_entries_id_seq', 1, false);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 3, true);


--
-- Name: task_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_comments_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: trip_audit_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_audit_history_id_seq', 1, true);


--
-- Name: trip_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_comments_id_seq', 1, false);


--
-- Name: trip_visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_visits_id_seq', 1, true);


--
-- Name: trips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trips_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: batches batches_batch_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_number_unique UNIQUE (batch_number);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: dryer_entries dryer_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dryer_entries
    ADD CONSTRAINT dryer_entries_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_unique UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expense_audit_history expense_audit_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_history
    ADD CONSTRAINT expense_audit_history_pkey PRIMARY KEY (id);


--
-- Name: expense_comments expense_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_comments
    ADD CONSTRAINT expense_comments_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_expense_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_expense_code_unique UNIQUE (expense_code);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: lots lots_lot_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_lot_number_unique UNIQUE (lot_number);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: outward_records outward_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outward_records
    ADD CONSTRAINT outward_records_pkey PRIMARY KEY (id);


--
-- Name: packaging_outputs packaging_outputs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packaging_outputs
    ADD CONSTRAINT packaging_outputs_pkey PRIMARY KEY (id);


--
-- Name: packaging_sizes packaging_sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packaging_sizes
    ADD CONSTRAINT packaging_sizes_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: processing_records processing_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_records
    ADD CONSTRAINT processing_records_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_variety_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_variety_unique UNIQUE (variety);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: stock_balances stock_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_pkey PRIMARY KEY (id);


--
-- Name: stock_entries stock_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_entries
    ADD CONSTRAINT stock_entries_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_task_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_task_code_unique UNIQUE (task_code);


--
-- Name: trip_audit_history trip_audit_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_audit_history
    ADD CONSTRAINT trip_audit_history_pkey PRIMARY KEY (id);


--
-- Name: trip_comments trip_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_comments
    ADD CONSTRAINT trip_comments_pkey PRIMARY KEY (id);


--
-- Name: trip_visits trip_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_visits
    ADD CONSTRAINT trip_visits_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: -
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: notifications notifications_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dH853fTueHsEgOwU3F7OEyfQA3isqOSkBP6qISCafEKXRfEKQPOgrC4LXv32qxA

