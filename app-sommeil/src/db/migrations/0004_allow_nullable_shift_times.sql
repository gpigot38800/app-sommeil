-- Migration: Autoriser start_time et end_time à être NULL pour les repos/absences
-- Date: 2026-02-13
-- Description: Les shifts de type "repos" ou "absence" n'ont pas d'horaires,
--              donc start_time et end_time doivent pouvoir être NULL

ALTER TABLE work_shifts
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE work_shifts
  ALTER COLUMN end_time DROP NOT NULL;
