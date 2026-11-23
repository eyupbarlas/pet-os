# 0013 — PowerSync Cloud (EU region, free plan) over self-hosting

- **Status:** proposed
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** ADR 0012, issue #5

## Context

ADR 0012 picks PowerSync. It can run as PowerSync Cloud or as the self-hosted service. The
research report assumed Cloud had no EU region and suggested self-hosting in Frankfurt. PowerSync's
docs (checked 2026-11-22) list an **EU** region (AWS `eu-west-1`, Ireland) that is fixed at instance
creation ([cloud instances](https://docs.powersync.com/configuration/powersync-service/cloud-instances.md)).
Eyup chose the Cloud free plan on 2026-11-22. The MVP has at most about 100 users and 1–3 builders.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. PowerSync Cloud, EU region, free | Zero ops; EU region; dashboard | DPA not listed on the pricing page (`unverified`); free instances are deactivated after inactivity (page says 1 week in one place, 2 weeks in another); 50 peak concurrent clients | $0; Pro from $49/month | Medium |
| B. Self-hosted PowerSync in Frankfurt (container + its own storage) | Full residency control; no plan limits | A service to run, patch, monitor and back up; a licence to check | VM ~€10–30/month + time | Medium |

## Decision

Use PowerSync Cloud, EU region, on the free plan. Create the instance in EU, because the
region can't be changed later.

## Consequences

- Easier: no sync infrastructure to run.
- Harder: watch for inactivity deactivation during quiet weeks; the uptime check should touch
  the service (`unverified` whether that counts as activity).
- Follow-up before public launch: obtain PowerSync's DPA, or move to self-hosting.
- Revisit if: more than 50 concurrent clients (move to Pro, $49), no DPA is available, or
  residency becomes a filter.
- Privacy flag: new sub-processor; data in Ireland (EU).
