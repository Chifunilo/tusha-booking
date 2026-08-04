--
-- PostgreSQL database dump
--

\restrict 9i1bMYFNJmTwda576DaP8MdWDPdrvMpcVNFYTQOcD0yi848PBPazD74tom7FRV7

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    booking_id integer NOT NULL,
    booking_reference character varying(20) NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    booking_type character varying(20) NOT NULL,
    room_id integer,
    check_in_date date,
    check_out_date date,
    num_guests integer,
    space_id integer,
    event_date date,
    event_start_time time without time zone,
    event_end_time time without time zone,
    event_type character varying(100),
    expected_attendance integer,
    base_price numeric(10,2) NOT NULL,
    taxes numeric(10,2) DEFAULT 0,
    service_fee numeric(10,2) DEFAULT 0,
    total_price numeric(10,2) NOT NULL,
    guest_name character varying(255) NOT NULL,
    guest_email character varying(255) NOT NULL,
    guest_phone character varying(20) NOT NULL,
    special_requests text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bookings_booking_type_check CHECK (((booking_type)::text = ANY ((ARRAY['room'::character varying, 'event'::character varying])::text[]))),
    CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'partially_paid'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying, 'no_show'::character varying])::text[]))),
    CONSTRAINT check_event_booking CHECK (((((booking_type)::text = 'event'::text) AND (space_id IS NOT NULL) AND (event_date IS NOT NULL)) OR ((booking_type)::text <> 'event'::text))),
    CONSTRAINT check_room_booking CHECK (((((booking_type)::text = 'room'::text) AND (room_id IS NOT NULL) AND (check_in_date IS NOT NULL) AND (check_out_date IS NOT NULL)) OR ((booking_type)::text <> 'room'::text)))
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: TABLE bookings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bookings IS 'All bookings (both room and event)';


--
-- Name: bookings_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_booking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_booking_id_seq OWNER TO postgres;

--
-- Name: bookings_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_booking_id_seq OWNED BY public.bookings.booking_id;


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    business_id integer NOT NULL,
    user_id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    business_email character varying(255),
    business_phone character varying(20),
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state_province character varying(100),
    country character varying(100) NOT NULL,
    postal_code character varying(20),
    business_type character varying(50) NOT NULL,
    description text,
    website character varying(255),
    registration_number character varying(100),
    tax_id character varying(50),
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT businesses_business_type_check CHECK (((business_type)::text = ANY ((ARRAY['hotel'::character varying, 'event_center'::character varying, 'both'::character varying])::text[])))
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- Name: TABLE businesses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.businesses IS 'Business profiles for business users';


--
-- Name: businesses_business_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.businesses_business_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.businesses_business_id_seq OWNER TO postgres;

--
-- Name: businesses_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.businesses_business_id_seq OWNED BY public.businesses.business_id;


--
-- Name: event_spaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_spaces (
    space_id integer NOT NULL,
    property_id integer NOT NULL,
    space_name character varying(255) NOT NULL,
    space_type character varying(50) NOT NULL,
    max_capacity integer NOT NULL,
    theatre_capacity integer,
    banquet_capacity integer,
    cocktail_capacity integer,
    size_sqm numeric(8,2),
    ceiling_height numeric(4,2),
    amenities text[],
    images text[],
    hourly_rate numeric(10,2),
    half_day_rate numeric(10,2),
    full_day_rate numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.event_spaces OWNER TO postgres;

--
-- Name: TABLE event_spaces; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_spaces IS 'Event spaces within properties';


--
-- Name: event_spaces_space_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_spaces_space_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_spaces_space_id_seq OWNER TO postgres;

--
-- Name: event_spaces_space_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_spaces_space_id_seq OWNED BY public.event_spaces.space_id;


--
-- Name: event_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_tickets (
    ticket_id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(10,2) NOT NULL,
    ticket_code character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_tickets_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'used'::character varying])::text[])))
);


ALTER TABLE public.event_tickets OWNER TO postgres;

--
-- Name: event_tickets_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_tickets_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_tickets_ticket_id_seq OWNER TO postgres;

--
-- Name: event_tickets_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_tickets_ticket_id_seq OWNED BY public.event_tickets.ticket_id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    property_id integer NOT NULL,
    space_id integer,
    event_name character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    max_capacity integer NOT NULL,
    tickets_available integer NOT NULL,
    ticket_price numeric(10,2) NOT NULL,
    organizer_name character varying(255),
    organizer_contact character varying(255),
    event_image text,
    is_published boolean DEFAULT false,
    is_cancelled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    property_id integer NOT NULL,
    business_id integer NOT NULL,
    property_name character varying(255) NOT NULL,
    property_type character varying(50) NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state_province character varying(100),
    country character varying(100) NOT NULL,
    postal_code character varying(20),
    description text,
    star_rating numeric(2,1),
    amenities text[],
    images text[],
    phone character varying(20),
    email character varying(255),
    is_published boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT properties_star_rating_check CHECK (((star_rating >= (0)::numeric) AND (star_rating <= (5)::numeric)))
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: TABLE properties; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.properties IS 'Properties (hotels/event centers) listed by businesses';


--
-- Name: properties_property_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.properties_property_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_property_id_seq OWNER TO postgres;

--
-- Name: properties_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.properties_property_id_seq OWNED BY public.properties.property_id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    booking_id integer NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    rating integer NOT NULL,
    cleanliness_rating integer,
    service_rating integer,
    location_rating integer,
    value_rating integer,
    title character varying(255),
    comment text,
    business_response text,
    response_date timestamp without time zone,
    is_verified boolean DEFAULT false,
    is_published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_cleanliness_rating_check CHECK (((cleanliness_rating >= 1) AND (cleanliness_rating <= 5))),
    CONSTRAINT reviews_location_rating_check CHECK (((location_rating >= 1) AND (location_rating <= 5))),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_service_rating_check CHECK (((service_rating >= 1) AND (service_rating <= 5))),
    CONSTRAINT reviews_value_rating_check CHECK (((value_rating >= 1) AND (value_rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: TABLE reviews; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.reviews IS 'Customer reviews for properties';


--
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_review_id_seq OWNER TO postgres;

--
-- Name: reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;


--
-- Name: room_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_availability (
    availability_id integer NOT NULL,
    room_id integer NOT NULL,
    date date NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    booking_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT room_availability_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'booked'::character varying, 'blocked'::character varying, 'maintenance'::character varying])::text[])))
);


ALTER TABLE public.room_availability OWNER TO postgres;

--
-- Name: TABLE room_availability; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.room_availability IS 'Track room availability by date';


--
-- Name: room_availability_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_availability_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_availability_availability_id_seq OWNER TO postgres;

--
-- Name: room_availability_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_availability_availability_id_seq OWNED BY public.room_availability.availability_id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    room_id integer NOT NULL,
    property_id integer NOT NULL,
    room_number character varying(10) NOT NULL,
    room_name character varying(100),
    room_type character varying(50) NOT NULL,
    floor_number integer,
    max_occupancy integer DEFAULT 2 NOT NULL,
    num_beds integer DEFAULT 1,
    bed_type character varying(50),
    size_sqm numeric(6,2),
    is_accessible boolean DEFAULT false,
    amenities text[],
    images text[],
    base_price numeric(10,2) NOT NULL,
    weekend_price numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rooms_base_price_check CHECK ((base_price >= (0)::numeric))
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: TABLE rooms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rooms IS 'Hotel rooms within properties';


--
-- Name: rooms_room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_room_id_seq OWNER TO postgres;

--
-- Name: rooms_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_room_id_seq OWNED BY public.rooms.room_id;


--
-- Name: space_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.space_availability (
    availability_id integer NOT NULL,
    space_id integer NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    booking_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT space_availability_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'booked'::character varying, 'blocked'::character varying])::text[])))
);


ALTER TABLE public.space_availability OWNER TO postgres;

--
-- Name: TABLE space_availability; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.space_availability IS 'Track event space availability with time slots';


--
-- Name: space_availability_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.space_availability_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.space_availability_availability_id_seq OWNER TO postgres;

--
-- Name: space_availability_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.space_availability_availability_id_seq OWNED BY public.space_availability.availability_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    user_type character varying(20) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    profile_image character varying(255),
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gender character varying(20),
    nationality character varying(20),
    CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['customer'::character varying, 'business'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'All users (customers and business owners)';


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: bookings booking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN booking_id SET DEFAULT nextval('public.bookings_booking_id_seq'::regclass);


--
-- Name: businesses business_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses ALTER COLUMN business_id SET DEFAULT nextval('public.businesses_business_id_seq'::regclass);


--
-- Name: event_spaces space_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_spaces ALTER COLUMN space_id SET DEFAULT nextval('public.event_spaces_space_id_seq'::regclass);


--
-- Name: event_tickets ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.event_tickets_ticket_id_seq'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: properties property_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties ALTER COLUMN property_id SET DEFAULT nextval('public.properties_property_id_seq'::regclass);


--
-- Name: reviews review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);


--
-- Name: room_availability availability_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_availability ALTER COLUMN availability_id SET DEFAULT nextval('public.room_availability_availability_id_seq'::regclass);


--
-- Name: rooms room_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN room_id SET DEFAULT nextval('public.rooms_room_id_seq'::regclass);


--
-- Name: space_availability availability_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.space_availability ALTER COLUMN availability_id SET DEFAULT nextval('public.space_availability_availability_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: bookings bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (business_id);


--
-- Name: event_spaces event_spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_spaces
    ADD CONSTRAINT event_spaces_pkey PRIMARY KEY (space_id);


--
-- Name: event_tickets event_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_tickets
    ADD CONSTRAINT event_tickets_pkey PRIMARY KEY (ticket_id);


--
-- Name: event_tickets event_tickets_ticket_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_tickets
    ADD CONSTRAINT event_tickets_ticket_code_key UNIQUE (ticket_code);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (property_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- Name: room_availability room_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_availability
    ADD CONSTRAINT room_availability_pkey PRIMARY KEY (availability_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (room_id);


--
-- Name: space_availability space_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.space_availability
    ADD CONSTRAINT space_availability_pkey PRIMARY KEY (availability_id);


--
-- Name: space_availability space_availability_space_id_date_tsrange_excl; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.space_availability
    ADD CONSTRAINT space_availability_space_id_date_tsrange_excl EXCLUDE USING gist (space_id WITH =, date WITH =, tsrange((date + start_time), (date + end_time)) WITH &&) WHERE (((status)::text = 'booked'::text));


--
-- Name: businesses unique_business_per_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT unique_business_per_user UNIQUE (user_id);


--
-- Name: reviews unique_review_per_booking; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review_per_booking UNIQUE (booking_id);


--
-- Name: room_availability unique_room_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_availability
    ADD CONSTRAINT unique_room_date UNIQUE (room_id, date);


--
-- Name: rooms unique_room_per_property; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT unique_room_per_property UNIQUE (property_id, room_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_bookings_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_dates ON public.bookings USING btree (check_in_date, check_out_date);


--
-- Name: idx_bookings_event_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_event_date ON public.bookings USING btree (event_date);


--
-- Name: idx_bookings_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_property ON public.bookings USING btree (property_id);


--
-- Name: idx_bookings_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_reference ON public.bookings USING btree (booking_reference);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_businesses_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_city ON public.businesses USING btree (city);


--
-- Name: idx_businesses_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_type ON public.businesses USING btree (business_type);


--
-- Name: idx_businesses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_user ON public.businesses USING btree (user_id);


--
-- Name: idx_event_tickets_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_tickets_event ON public.event_tickets USING btree (event_id);


--
-- Name: idx_event_tickets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_tickets_user ON public.event_tickets USING btree (user_id);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_date ON public.events USING btree (event_date);


--
-- Name: idx_events_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_property ON public.events USING btree (property_id);


--
-- Name: idx_properties_business; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_business ON public.properties USING btree (business_id);


--
-- Name: idx_properties_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_city ON public.properties USING btree (city);


--
-- Name: idx_properties_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_published ON public.properties USING btree (is_published);


--
-- Name: idx_properties_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_type ON public.properties USING btree (property_type);


--
-- Name: idx_reviews_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_property ON public.reviews USING btree (property_id);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_room_availability_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_availability_date ON public.room_availability USING btree (room_id, date);


--
-- Name: idx_rooms_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_price ON public.rooms USING btree (base_price);


--
-- Name: idx_rooms_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_property ON public.rooms USING btree (property_id);


--
-- Name: idx_rooms_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_type ON public.rooms USING btree (room_type);


--
-- Name: idx_space_availability_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_space_availability_date ON public.space_availability USING btree (space_id, date);


--
-- Name: idx_spaces_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spaces_property ON public.event_spaces USING btree (property_id);


--
-- Name: idx_spaces_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spaces_type ON public.event_spaces USING btree (space_type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_type ON public.users USING btree (user_type);


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: businesses update_businesses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_spaces update_event_spaces_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_spaces_updated_at BEFORE UPDATE ON public.event_spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: properties update_properties_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rooms update_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: bookings bookings_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id);


--
-- Name: bookings bookings_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.event_spaces(space_id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: businesses businesses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: event_spaces event_spaces_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_spaces
    ADD CONSTRAINT event_spaces_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id) ON DELETE CASCADE;


--
-- Name: event_tickets event_tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_tickets
    ADD CONSTRAINT event_tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id);


--
-- Name: event_tickets event_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_tickets
    ADD CONSTRAINT event_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: events events_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: events events_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.event_spaces(space_id);


--
-- Name: properties properties_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id);


--
-- Name: reviews reviews_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: room_availability room_availability_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_availability
    ADD CONSTRAINT room_availability_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id);


--
-- Name: room_availability room_availability_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_availability
    ADD CONSTRAINT room_availability_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id) ON DELETE CASCADE;


--
-- Name: rooms rooms_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id) ON DELETE CASCADE;


--
-- Name: space_availability space_availability_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.space_availability
    ADD CONSTRAINT space_availability_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id);


--
-- Name: space_availability space_availability_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.space_availability
    ADD CONSTRAINT space_availability_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.event_spaces(space_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9i1bMYFNJmTwda576DaP8MdWDPdrvMpcVNFYTQOcD0yi848PBPazD74tom7FRV7

