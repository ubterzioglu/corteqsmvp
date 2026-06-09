#!/usr/bin/env python3
"""
Phase 4 programmatic rewire generator.

Pulls every public function that references a renamed table/column from the LOCAL
supabase DB, applies safe word-boundary table-name substitutions (+ targeted
column fixes for the renamed columns), and emits a single create-or-replace
migration. Prints a per-function diff summary for review.

Run from repo root with local supabase up:
  python3 docs/catalog-role-afs-rebuild/_phase4_rewire.py > /tmp/phase4.sql
"""
import json, re, subprocess, sys, io

# Force UTF-8 stdout/stderr (Windows defaults to cp1252 which chokes on Turkish chars)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

CONTAINER = "supabase_db_injprdrsklkxgnaiixzh"

# Table renames — safe, word-boundary.
TABLE_MAP = {
    "attribute_catalog": "afs_attributes",
    "feature_catalog": "afs_features",
    "profile_section_catalog": "afs_sections",
    "role_attribute_rules": "role_attributes",
    "role_feature_flags": "role_features",
    "role_profile_section_rules": "role_sections",
    "catalog_item_attributes": "catalog_item_attribute_values",
    "catalog_claim_requests": "catalog_item_claims",
    "catalog_item_memberships": "catalog_item_managers",
}

def psql(sql):
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "psql", "-U", "postgres", "-t", "-A", "-c", sql],
        capture_output=True, text=True, encoding="utf-8",
    )
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        sys.exit(1)
    return r.stdout

def get_target_functions():
    toks = "','".join(TABLE_MAP.keys())
    sql = f"""
    select p.oid::text
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    cross join lateral (values ('{toks}')) ignore_me(x)
    where n.nspname='public' and p.prokind='f'
      and (
        {' or '.join(f"pg_get_functiondef(p.oid) ~ '\\m{re.escape(t)}\\M'" for t in TABLE_MAP)}
      )
    order by p.proname;
    """
    return [oid.strip() for oid in psql(sql).splitlines() if oid.strip()]

def transform(defn):
    notes = []
    out = defn
    # 1. table renames (word boundary, schema-qualified or bare)
    for old, new in TABLE_MAP.items():
        pat = re.compile(rf'(?<![A-Za-z0-9_])(public\.)?{re.escape(old)}(?![A-Za-z0-9_])')
        n = len(pat.findall(out))
        if n:
            out = pat.sub(lambda m: (m.group(1) or '') + new, out)
            notes.append(f"{old}->{new}({n})")
    return out, notes

def main():
    oids = get_target_functions()
    sys.stderr.write(f"-- {len(oids)} functions to rewire\n")
    print("-- Catalog/Flat-Role/AFS Rebuild — Migration 010c: programmatic backend rewire")
    print("-- Auto-generated from local DB pg_get_functiondef + safe table-name substitution.")
    print("-- Table renames only; column-level (title/role) fixes applied separately.")
    print()
    for oid in oids:
        name = psql(f"select proname from pg_proc where oid={oid};").strip()
        defn = psql(f"select pg_get_functiondef({oid}::oid);").strip()
        if not defn:
            continue
        new_defn, notes = transform(defn)
        sys.stderr.write(f"-- {name}: {', '.join(notes)}\n")
        print(f"-- {name}: {', '.join(notes)}")
        print(new_defn.rstrip(";") + ";")
        print()

if __name__ == "__main__":
    main()
