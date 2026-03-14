-- ============================================
-- PrithviNet Supabase Schema
-- Run this in your Supabase SQL Editor
-- This schema mirrors the current frontend data model.
-- Re-running it will reset these demo tables.
-- ============================================

DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS compliance_cases CASCADE;
DROP TABLE IF EXISTS monitoring_logs CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS prescribed_limits CASCADE;
DROP TABLE IF EXISTS parameter_units CASCADE;
DROP TABLE IF EXISTS monitoring_locations CASCADE;
DROP TABLE IF EXISTS regional_offices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Users (Admin management)
-- ============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'regional_officer', 'monitoring_team', 'industry_user', 'citizen')),
  region TEXT NOT NULL DEFAULT '',
  team TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  "lastLogin" TEXT NOT NULL DEFAULT 'Never',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Regional Offices
-- ============================================
CREATE TABLE regional_offices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  "headOfficer" TEXT NOT NULL DEFAULT '',
  stations INT NOT NULL DEFAULT 0,
  industries INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Monitoring Locations
-- ============================================
CREATE TABLE monitoring_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('air', 'water', 'noise')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Live' CHECK (status IN ('Live', 'Delay', 'Offline')),
  "installDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  "lastMaintenance" DATE NOT NULL DEFAULT CURRENT_DATE,
  equipment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Parameter Units & Limits
-- ============================================
CREATE TABLE parameter_units (
  id TEXT PRIMARY KEY,
  parameter TEXT NOT NULL,
  symbol TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('air', 'water', 'noise')),
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE prescribed_limits (
  id TEXT PRIMARY KEY,
  parameter TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('air', 'water', 'noise')),
  context TEXT NOT NULL,
  "limit" DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Monitoring Campaigns
-- ============================================
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('air', 'water', 'noise', 'multi')),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Scheduled', 'Completed', 'Paused')),
  region TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  stations INT NOT NULL DEFAULT 0,
  "assignedTeam" TEXT NOT NULL DEFAULT '',
  lead TEXT NOT NULL DEFAULT '',
  progress INT NOT NULL DEFAULT 0,
  "samplesCollected" INT NOT NULL DEFAULT 0,
  "samplesTarget" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Monitoring Logs
-- ============================================
CREATE TABLE monitoring_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('air', 'water', 'noise', 'industry')),
  station TEXT NOT NULL,
  region TEXT NOT NULL,
  date DATE NOT NULL,
  "submittedBy" TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('Complete', 'Partial', 'Pending Review', 'Missing')),
  summary TEXT NOT NULL DEFAULT '',
  parameters INT NOT NULL DEFAULT 0,
  violations INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Direct Field Submissions
-- ============================================
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('air', 'water', 'noise')),
  station TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  "submittedBy" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Submitted', 'Validated', 'Rejected')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Compliance Cases
-- ============================================
CREATE TABLE compliance_cases (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  "entityType" TEXT NOT NULL CHECK ("entityType" IN ('Industry', 'Municipal', 'Government')),
  region TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('air', 'water', 'noise')),
  parameter TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  "limit" DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'Escalated', 'Under Inspection', 'Notice Issued', 'Resolved', 'Closed')),
  "firstDetected" DATE NOT NULL,
  "lastViolation" DATE NOT NULL,
  occurrences INT NOT NULL DEFAULT 1,
  "assignedTo" TEXT NOT NULL DEFAULT '',
  "escalationHistory" JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Periodic Reports
-- ============================================
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Monthly', 'Quarterly', 'Annual')),
  region TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Published', 'Overdue')),
  "generatedOn" DATE,
  pages INT NOT NULL DEFAULT 0,
  highlights TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Seed: Regional Offices
-- ============================================
INSERT INTO regional_offices (id, name, code, state, district, address, phone, email, "headOfficer", stations, industries, status) VALUES
  ('RO01', 'Central Pollution Control Board', 'CPCB', 'Delhi', 'New Delhi', '', '', '', 'Chairman CPCB', 0, 0, 'Active'),
  ('RO02', 'Andhra Pradesh PCB', 'APPCB', 'Andhra Pradesh', 'Vijayawada', '', '', '', '', 0, 0, 'Active'),
  ('RO03', 'Arunachal Pradesh ENVIS', 'ARSPCB', 'Arunachal Pradesh', 'Itanagar', '', '', '', '', 0, 0, 'Active'),
  ('RO04', 'Assam PCB', 'ASPCB', 'Assam', 'Guwahati', '', '', '', '', 0, 0, 'Active'),
  ('RO05', 'Bihar SPCB', 'BSPCB', 'Bihar', 'Patna', '', '', '', '', 0, 0, 'Active'),
  ('RO06', 'Chhattisgarh ENVIS', 'CGPCB', 'Chhattisgarh', 'Raipur', '', '', '', '', 0, 0, 'Active'),
  ('RO07', 'Delhi PCC', 'DPCC', 'Delhi', 'New Delhi', '', '', '', '', 0, 0, 'Active'),
  ('RO08', 'Goa SPCB', 'GSPCB', 'Goa', 'Panaji', '', '', '', '', 0, 0, 'Active'),
  ('RO09', 'Gujarat PCB', 'GPCB', 'Gujarat', 'Gandhinagar', '', '', '', '', 0, 0, 'Active'),
  ('RO10', 'Haryana SPCB', 'HSPCB', 'Haryana', 'Panchkula', '', '', '', '', 0, 0, 'Active'),
  ('RO11', 'Himachal Pradesh PCB', 'HPPCB', 'Himachal Pradesh', 'Shimla', '', '', '', '', 0, 0, 'Active'),
  ('RO12', 'Jharkhand SPCB', 'JSPCB', 'Jharkhand', 'Ranchi', '', '', '', '', 0, 0, 'Active'),
  ('RO13', 'Karnataka SPCB', 'KSPCB', 'Karnataka', 'Bengaluru', '', '', '', '', 0, 0, 'Active'),
  ('RO14', 'Kerala SPCB', 'KPCB', 'Kerala', 'Thiruvananthapuram', '', '', '', '', 0, 0, 'Active'),
  ('RO15', 'Madhya Pradesh PCB', 'MPPCB', 'Madhya Pradesh', 'Bhopal', '', '', '', '', 0, 0, 'Active'),
  ('RO16', 'Maharashtra PCB', 'MPCB', 'Maharashtra', 'Mumbai', '', '', '', '', 0, 0, 'Active'),
  ('RO17', 'Manipur PCB', 'MNPCB', 'Manipur', 'Imphal', '', '', '', '', 0, 0, 'Active'),
  ('RO18', 'Meghalaya SPCB', 'MEGSPCB', 'Meghalaya', 'Shillong', '', '', '', '', 0, 0, 'Active'),
  ('RO19', 'Mizoram PCB', 'MZPCB', 'Mizoram', 'Aizawl', '', '', '', '', 0, 0, 'Active'),
  ('RO20', 'Nagaland PCB', 'NPCB', 'Nagaland', 'Kohima', '', '', '', '', 0, 0, 'Active'),
  ('RO21', 'Odisha SPCB', 'OSPCB', 'Odisha', 'Bhubaneswar', '', '', '', '', 0, 0, 'Active'),
  ('RO22', 'Punjab PCB', 'PPCB', 'Punjab', 'Patiala', '', '', '', '', 0, 0, 'Active'),
  ('RO23', 'Rajasthan SPCB', 'RSPCB', 'Rajasthan', 'Jaipur', '', '', '', '', 0, 0, 'Active'),
  ('RO24', 'Sikkim SPCB', 'SSPCB', 'Sikkim', 'Gangtok', '', '', '', '', 0, 0, 'Active'),
  ('RO25', 'Tamil Nadu PCB', 'TNPCB', 'Tamil Nadu', 'Chennai', '', '', '', '', 0, 0, 'Active'),
  ('RO26', 'Telangana SPCB', 'TSPCB', 'Telangana', 'Hyderabad', '', '', '', '', 0, 0, 'Active'),
  ('RO27', 'Tripura SPCB', 'TRSPCB', 'Tripura', 'Agartala', '', '', '', '', 0, 0, 'Active'),
  ('RO28', 'Uttar Pradesh PCB', 'UPPCB', 'Uttar Pradesh', 'Lucknow', '', '', '', '', 0, 0, 'Active'),
  ('RO29', 'Uttarakhand ENVIS', 'UKPCB', 'Uttarakhand', 'Dehradun', '', '', '', '', 0, 0, 'Active'),
  ('RO30', 'West Bengal PCB', 'WBPCB', 'West Bengal', 'Kolkata', '', '', '', '', 0, 0, 'Active'),
  ('RO31', 'Jammu & Kashmir PCB', 'JKPCB', 'Jammu & Kashmir', 'Srinagar', '', '', '', '', 0, 0, 'Active'),
  ('RO32', 'Ladakh PCC', 'LKPCC', 'Ladakh', 'Leh', '', '', '', '', 0, 0, 'Active'),
  ('RO33', 'Chandigarh PCC', 'CHPCC', 'Chandigarh', 'Chandigarh', '', '', '', '', 0, 0, 'Active'),
  ('RO34', 'Puducherry PCC', 'PYPCC', 'Puducherry', 'Puducherry', '', '', '', '', 0, 0, 'Active'),
  ('RO35', 'Andaman & Nicobar PCC', 'ANPCC', 'Andaman & Nicobar', 'Port Blair', '', '', '', '', 0, 0, 'Active'),
  ('RO36', 'Dadra & NH and Daman & Diu PCC', 'DDDPCC', 'Dadra & Nagar Haveli', 'Silvassa', '', '', '', '', 0, 0, 'Active'),
  ('RO37', 'Lakshadweep PCC', 'LKDPCC', 'Lakshadweep', 'Kavaratti', '', '', '', '', 0, 0, 'Active');

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescribed_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON regional_offices FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON monitoring_locations FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON parameter_units FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON prescribed_limits FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON monitoring_logs FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON submissions FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON compliance_cases FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON reports FOR SELECT USING (true);

CREATE POLICY "Allow insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON users FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON regional_offices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON regional_offices FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON regional_offices FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON monitoring_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON monitoring_locations FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON monitoring_locations FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON parameter_units FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON parameter_units FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON parameter_units FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON prescribed_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON prescribed_limits FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON prescribed_limits FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON campaigns FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON monitoring_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON monitoring_logs FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON monitoring_logs FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON submissions FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON submissions FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON compliance_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON compliance_cases FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON compliance_cases FOR DELETE USING (true);

CREATE POLICY "Allow insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON reports FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON reports FOR DELETE USING (true);
