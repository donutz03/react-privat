--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2025-01-22 11:24:36

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 32916)
-- Name: claimed_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claimed_products (
    id integer NOT NULL,
    food_id integer,
    claimed_by integer,
    original_owner integer,
    claimed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pickup_confirmed boolean DEFAULT false,
    status character varying(50) DEFAULT 'waiting_pickup'::character varying
);


ALTER TABLE public.claimed_products OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 32915)
-- Name: claimed_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claimed_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claimed_products_id_seq OWNER TO postgres;

--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 233
-- Name: claimed_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claimed_products_id_seq OWNED BY public.claimed_products.id;


--
-- TOC entry 220 (class 1259 OID 32780)
-- Name: food_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.food_categories OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 32779)
-- Name: food_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.food_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.food_categories_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 219
-- Name: food_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.food_categories_id_seq OWNED BY public.food_categories.id;


--
-- TOC entry 223 (class 1259 OID 32808)
-- Name: food_category_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_category_relations (
    food_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.food_category_relations OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 32789)
-- Name: foods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.foods (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    expiration_date date NOT NULL,
    is_available boolean DEFAULT false,
    is_expired boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_data bytea NOT NULL,
    image_type text NOT NULL
);


ALTER TABLE public.foods OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 32788)
-- Name: foods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.foods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.foods_id_seq OWNER TO postgres;

--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 221
-- Name: foods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.foods_id_seq OWNED BY public.foods.id;


--
-- TOC entry 225 (class 1259 OID 32824)
-- Name: friend_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.friend_tags OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 32823)
-- Name: friend_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.friend_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friend_tags_id_seq OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 224
-- Name: friend_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.friend_tags_id_seq OWNED BY public.friend_tags.id;


--
-- TOC entry 228 (class 1259 OID 32852)
-- Name: friendship_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendship_tags (
    friendship_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.friendship_tags OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 32833)
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    user_id integer,
    friend_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.friendships OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 32832)
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friendships_id_seq OWNER TO postgres;

--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 226
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- TOC entry 231 (class 1259 OID 32880)
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    group_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 32868)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 32867)
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

--
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 229
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- TOC entry 232 (class 1259 OID 32895)
-- Name: shared_list_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shared_list_access (
    user_id integer NOT NULL,
    viewer_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shared_list_access OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 32770)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20) DEFAULT ''::character varying NOT NULL,
    address text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 32769)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4756 (class 2604 OID 32919)
-- Name: claimed_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claimed_products ALTER COLUMN id SET DEFAULT nextval('public.claimed_products_id_seq'::regclass);


--
-- TOC entry 4745 (class 2604 OID 32783)
-- Name: food_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_categories ALTER COLUMN id SET DEFAULT nextval('public.food_categories_id_seq'::regclass);


--
-- TOC entry 4746 (class 2604 OID 32792)
-- Name: foods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foods ALTER COLUMN id SET DEFAULT nextval('public.foods_id_seq'::regclass);


--
-- TOC entry 4750 (class 2604 OID 32827)
-- Name: friend_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_tags ALTER COLUMN id SET DEFAULT nextval('public.friend_tags_id_seq'::regclass);


--
-- TOC entry 4751 (class 2604 OID 32836)
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- TOC entry 4753 (class 2604 OID 32871)
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- TOC entry 4741 (class 2604 OID 32773)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


-- Completed on 2025-01-22 11:24:36

--
-- PostgreSQL database dump complete
--

