-- Optional hosted seed. The interactive demo uses LocalDemoProvider + src/server/data/seed.ts.
-- All rows are DEMO DATA, not actual SAMCO production records.

insert into numbering_sequences (prefix, year, next_value, padding) values
  ('NCR', 2026, 40, 4),
  ('CAPA', 2026, 40, 4),
  ('CC', 2026, 40, 4),
  ('SNCR', 2026, 40, 4)
on conflict do nothing;
