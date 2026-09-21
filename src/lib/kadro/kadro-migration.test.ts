import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("kadro migration contract", () => {
  const migrationPath = join(__dirname, "../../../supabase/migrations/applied/20260920100000_kadro_konsolu.sql");
  const sql = readFileSync(migrationPath, "utf-8");

  it("creates kadro_role_states table with correct columns", () => {
    expect(sql).toContain("create table if not exists public.kadro_role_states");
    expect(sql).toMatch(/role_key\s+text primary key/);
    expect(sql).toMatch(/status\s+text/);
    expect(sql).toMatch(/priority\s+text/);
    expect(sql).toMatch(/owner_name\s+text/);
    expect(sql).toMatch(/note\s+text/);
    expect(sql).toMatch(/updated_at\s+timestamptz/);
    expect(sql).toMatch(/updated_by\s+uuid/);
  });

  it("creates kadro_role_events table with correct columns", () => {
    expect(sql).toContain("create table if not exists public.kadro_role_events");
    expect(sql).toMatch(/id\s+uuid primary key/);
    expect(sql).toMatch(/role_key\s+text/);
    expect(sql).toMatch(/field\s+text/);
    expect(sql).toMatch(/old_value\s+text/);
    expect(sql).toMatch(/new_value\s+text/);
    expect(sql).toMatch(/changed_by\s+uuid/);
    expect(sql).toMatch(/changed_at\s+timestamptz/);
  });

  it("creates kadro_candidates table with correct columns", () => {
    expect(sql).toContain("create table if not exists public.kadro_candidates");
    expect(sql).toMatch(/id\s+uuid primary key/);
    expect(sql).toMatch(/role_key\s+text/);
    expect(sql).toMatch(/full_name\s+text/);
    expect(sql).toMatch(/links\s+text/);
    expect(sql).toMatch(/stage\s+text/);
    expect(sql).toMatch(/note\s+text/);
    expect(sql).toMatch(/created_by\s+uuid/);
    expect(sql).toMatch(/created_at\s+timestamptz/);
    expect(sql).toMatch(/updated_at\s+timestamptz/);
  });

  it("includes CHECK constraints for status values", () => {
    expect(sql).toContain("check (status in");
    expect(sql).toContain("'dolu'");
    expect(sql).toContain("'destek'");
    expect(sql).toContain("'gorusme'");
    expect(sql).toContain("'aday'");
    expect(sql).toContain("'teklif'");
    expect(sql).toContain("'acik'");
    expect(sql).toContain("'beklemede'");
  });

  it("includes CHECK constraints for priority values", () => {
    expect(sql).toContain("check (priority in");
    expect(sql).toContain("'kritik'");
    expect(sql).toContain("'yuksek'");
    expect(sql).toContain("'orta'");
    expect(sql).toContain("'dusuk'");
  });

  it("includes CHECK constraints for stage values", () => {
    expect(sql).toContain("check (stage in");
    expect(sql).toContain("'aday'");
    expect(sql).toContain("'gorusme'");
    expect(sql).toContain("'teklif'");
    expect(sql).toContain("'kapandi'");
  });

  it("creates trigger for automatic event logging", () => {
    expect(sql).toContain("create or replace function public.log_kadro_role_state_change()");
    expect(sql).toContain("create trigger log_kadro_role_state_change");
    expect(sql).toContain("after insert or update on public.kadro_role_states");
  });

  it("creates updated_at triggers", () => {
    expect(sql).toContain("create or replace function public.set_kadro_updated_at()");
    expect(sql).toContain("create trigger set_kadro_role_states_updated_at");
    expect(sql).toContain("create trigger set_kadro_candidates_updated_at");
  });

  it("enables RLS on all tables", () => {
    expect(sql).toMatch(/alter table public\.kadro_role_states\s+enable row level security/);
    expect(sql).toMatch(/alter table public\.kadro_role_events\s+enable row level security/);
    expect(sql).toMatch(/alter table public\.kadro_candidates\s+enable row level security/);
  });

  it("creates admin-only policies for kadro_role_states", () => {
    expect(sql).toContain("create policy kadro_role_states_admin_select");
    expect(sql).toContain("create policy kadro_role_states_admin_insert");
    expect(sql).toContain("create policy kadro_role_states_admin_update");
    expect(sql).toContain("create policy kadro_role_states_admin_delete");
    expect(sql).toContain("using (public.is_admin(auth.uid()))");
  });

  it("creates admin-only policies for kadro_candidates", () => {
    expect(sql).toContain("create policy kadro_candidates_admin_select");
    expect(sql).toContain("create policy kadro_candidates_admin_insert");
    expect(sql).toContain("create policy kadro_candidates_admin_update");
    expect(sql).toContain("create policy kadro_candidates_admin_delete");
  });

  it("creates select-only policy for kadro_role_events (append-only)", () => {
    expect(sql).toContain("create policy kadro_role_events_admin_select");
    expect(sql).not.toContain("create policy kadro_role_events_admin_insert");
    expect(sql).not.toContain("create policy kadro_role_events_admin_update");
    expect(sql).not.toContain("create policy kadro_role_events_admin_delete");
  });

  it("creates necessary indexes", () => {
    expect(sql).toContain("create index if not exists kadro_role_events_role_idx");
    expect(sql).toContain("create index if not exists kadro_candidates_role_idx");
  });
});
