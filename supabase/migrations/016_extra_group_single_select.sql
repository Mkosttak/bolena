-- Migration 016: Add max_bir_secim (single-select override) to extra_groups
-- This field is independent of is_required.
-- When true, optional groups behave like radio groups (only one selection at a time)
-- but remain non-required (user can leave the group empty).
--
-- Selection logic in the UI:
--   isSingleSelect = group.is_required OR group.max_bir_secim

ALTER TABLE extra_groups
  ADD COLUMN IF NOT EXISTS max_bir_secim BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN extra_groups.max_bir_secim IS
  'When true, only one option can be selected at a time (radio behavior), '
  'even if is_required=false. Combined logic: isSingleSelect = is_required OR max_bir_secim';
