-- Reassert the trigram index required by marketplace text search.
-- IF NOT EXISTS keeps this safe when the index was already created by the
-- initial migration, while repairing databases whose recorded migration
-- state and physical schema have drifted.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Listing_searchText_trgm_idx"
    ON "Listing" USING GIN ("searchText" gin_trgm_ops);
