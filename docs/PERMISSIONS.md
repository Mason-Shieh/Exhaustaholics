# Permissions

`lib/policy/index.ts` is the role policy source. Unknown roles, resources, actions, and missing tenant context are denied. `lib/policy/index.test.ts` exercises every role/resource/action cell and the tenant/assignment checks.

## Role Matrix

Cells list allowed actions; all unlisted actions are denied. `manage` is reserved for owner/admin configuration and is not implied by `create`, `update`, or `delete`.

| Resource | Owner | Shop admin | Fabricator | Sales | Customer |
|---|---|---|---|---|---|
| Vehicles | All | All | Read | Read, create, update | Read, create, update |
| Customers | All | All | — | Read, create, update | — |
| Projects | All | All | Read | Read, create, update | Read, create, update |
| Revisions | All | All | Read, create, update | Read | Read |
| Quotes | All | All | — | Read, create, update | Read |
| BOM | All | All | Read | Read | Read |
| Approvals | All | All | — | Read | Read, create, approve |
| Status events | All | All | Read, create | Read | Read |
| Builds | All | All | Read, update | Read | — |
| Invoices | All | All | — | Read, create, update | Read |
| Notes | All | All | — | Read, create, update | — |
| Analytics | All | All | — | Read | — |
| Price books | All | All | — | Read | — |
| Billing | All | All | — | — | — |
| Users | All | All | — | — | — |
| Settings | All | All | — | — | — |
| API keys | All | All | — | — | — |

## Scope Rules

- Owner, shop admin, and sales requests require a target row with the actor's `shop_id`.
- Fabricators require the matching shop and `assigned_fabricator_id` for each build or related resource. Fabricators have no quote or price-book permissions, so they cannot see margins.
- Customers require `owner_id` to match their authenticated identity. A customer never receives access to another customer's garage, projects, revisions, quotes, BOMs, approvals, or invoices.
- The DAL adds explicit row predicates and establishes PostgreSQL RLS settings in the same transaction. Application code must derive scope from verified server-side auth, never request JSON.