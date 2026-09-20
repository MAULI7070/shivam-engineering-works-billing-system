-- Calculator history table
CREATE TABLE IF NOT EXISTS calculations (
  id          SERIAL PRIMARY KEY,
  type        VARCHAR(20) NOT NULL,  -- 'Grinding' | 'Milling' | 'Surface'
  description TEXT        NOT NULL,
  side1       NUMERIC(10,2) DEFAULT 0,
  side2       NUMERIC(10,2) DEFAULT 0,
  side3       NUMERIC(10,2) DEFAULT 0,
  rupees      NUMERIC(10,2) DEFAULT 0,
  formula     TEXT,
  part1       NUMERIC(12,2) DEFAULT 0,
  part2       NUMERIC(12,2) DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calculations_type ON calculations(type);
CREATE INDEX IF NOT EXISTS idx_calculations_created ON calculations(created_at DESC);
