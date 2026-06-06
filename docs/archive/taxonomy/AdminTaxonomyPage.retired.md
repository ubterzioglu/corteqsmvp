# AdminTaxonomyPage Retired

`/admin/new-member/taxonomy` is retired from the active admin product flow.

Status:

- navigation entry removed
- route redirected to `/admin/new-member/guide?notice=taxonomy-retired`
- taxonomy tables kept in the database for rollback and future label migration
- legacy page component remains only in git history / source tree for reference during the decommission window

This screen should not be reintroduced as a parallel role-behavior management surface.
