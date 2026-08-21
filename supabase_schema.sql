-- Create the Archive table
CREATE TABLE IF NOT EXISTS "Archive" (
  id text PRIMARY KEY, -- We use text to store Airtable's record IDs directly
  "Name" text NOT NULL,
  "Medium" text,
  "Year" text,
  "Dimensions" text,
  "Notes" text,
  "Image_url" text,
  "Thumbnail_url" text,
  "Filmstrip_url" text,
  "Status" text DEFAULT 'Active',
  "Category" text,
  "Series" text[], -- Storing multi-select values as text array
  "Substrate" text,
  "Additional_Images" text[], -- Array of image URLs
  "ShowAtEvent" boolean DEFAULT false,
  "ArtSupplyPrint" boolean DEFAULT false,
  "Pinterest" boolean DEFAULT false,
  "Featured" boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Archive
ALTER TABLE "Archive" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read Active archive records
CREATE POLICY "Allow public read-only access to active archive" ON "Archive"
  FOR SELECT USING (lower("Status") <> 'hide');

-- Create policy to allow authenticated users (or service role) to perform all actions
CREATE POLICY "Allow all actions for admin" ON "Archive"
  FOR ALL USING (true);


-- Create the HeroSlideshow table
CREATE TABLE IF NOT EXISTS "HeroSlideshow" (
  id text PRIMARY KEY, -- Keep Airtable IDs
  "Image_url" text NOT NULL,
  "Active" boolean DEFAULT true,
  "Order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on HeroSlideshow
ALTER TABLE "HeroSlideshow" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to active slides" ON "HeroSlideshow"
  FOR SELECT USING ("Active" = true);

-- Create policy for admin
CREATE POLICY "Allow all actions for admin" ON "HeroSlideshow"
  FOR ALL USING (true);


-- Create the Interests table
CREATE TABLE IF NOT EXISTS "Interests" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Artwork" text NOT NULL,
  "Email" text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Interests
ALTER TABLE "Interests" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (form submission)
CREATE POLICY "Allow public insert to Interests" ON "Interests"
  FOR INSERT WITH CHECK (true);

-- Create policy to allow admin to view/manage
CREATE POLICY "Allow all actions for admin" ON "Interests"
  FOR ALL USING (true);


-- Create the Newsletter table
CREATE TABLE IF NOT EXISTS "Newsletter" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Email" text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Newsletter
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (subscription form)
CREATE POLICY "Allow public insert to Newsletter" ON "Newsletter"
  FOR INSERT WITH CHECK (true);

-- Create policy to allow admin to view/manage
CREATE POLICY "Allow all actions for admin" ON "Newsletter"
  FOR ALL USING (true);


-- Create the Survey Responses table
CREATE TABLE IF NOT EXISTS "Survey Responses" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Discovery Source" text,
  "Resonances" text,
  "Art as Dialogue" text,
  "Interaction Frequency" text,
  "Purchase Intent" text,
  "Values" text,
  "Requests" text,
  "Additional Thoughts" text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Survey Responses
ALTER TABLE "Survey Responses" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert
CREATE POLICY "Allow public insert to Survey Responses" ON "Survey Responses"
  FOR INSERT WITH CHECK (true);

-- Create policy for admin
CREATE POLICY "Allow all actions for admin" ON "Survey Responses"
  FOR ALL USING (true);


-- Create the ShowcaseInquiries table
CREATE TABLE IF NOT EXISTS "ShowcaseInquiries" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Name" text NOT NULL,
  "Email" text NOT NULL,
  "Location" text,
  "InterestType" text,
  "Details" text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ShowcaseInquiries
ALTER TABLE "ShowcaseInquiries" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert
CREATE POLICY "Allow public insert to ShowcaseInquiries" ON "ShowcaseInquiries"
  FOR INSERT WITH CHECK (true);

-- Create policy for admin
CREATE POLICY "Allow all actions for admin on ShowcaseInquiries" ON "ShowcaseInquiries"
  FOR ALL USING (true);


-- Create the ActiveCarts table for Cart Analytics
CREATE TABLE IF NOT EXISTS "ActiveCarts" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_id text,
  title text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  category text,
  image_url text,
  ip_address text,
  city text,
  region text,
  postal_code text,
  country text,
  user_agent text,
  last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ActiveCarts
ALTER TABLE "ActiveCarts" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert/update (cart sync from client)
CREATE POLICY "Allow public insert and update to ActiveCarts" ON "ActiveCarts"
  FOR ALL USING (true);

