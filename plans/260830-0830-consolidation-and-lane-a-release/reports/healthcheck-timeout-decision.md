# Healthcheck timeout decision

Captured: 30 August 2026

## Decision

Retain `healthcheckTimeout: null` for the Railway `mkttool-web` production service.

`null` is correct here because it inherits Railway's documented, bounded default of **300 seconds**.
It does not mean an infinite or disabled timeout. Railway checks `/api/healthz` only while promoting a
new deployment; if the route does not return HTTP 200 within 300 seconds, the deployment fails and
the prior deployment keeps serving traffic.

An additional `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` override would duplicate the platform default without
changing the effective bound. Keep the inherited value until the service has a measured startup SLO
that justifies a tighter value, or Railway changes its documented default. Recheck this decision if
either condition changes.

## Live evidence

- Railway project/environment/service: `renewed-benevolence` / `production` / `mkttool-web`.
- `serviceInstance.healthcheckPath`: `/api/healthz`.
- `serviceInstance.healthcheckTimeout`: `null`.
- `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` present: `false`.
- Effective deploy-time bound: `300` seconds, inherited from Railway.
- Five external GETs returned HTTP 200 in `1284`, `550`, `841`, `423`, and `841` ms. These are
  route-response observations, not container-startup measurements.

## Verification commands

```powershell
$query = 'query { serviceInstance(environmentId: "493f334a-1285-4768-89ef-23b341f27a06", serviceId: "0caa99b6-e85d-4c5f-a085-13406a5a7e4c") { healthcheckPath healthcheckTimeout } }'
railway api $query --compact

$raw = railway variables --service mkttool-web --environment production --json
$vars = $raw | ConvertFrom-Json
$vars.PSObject.Properties.Name -contains 'RAILWAY_HEALTHCHECK_TIMEOUT_SEC'
```

The official Railway healthcheck documentation is the authority for the inherited 300-second value:
<https://docs.railway.com/deployments/healthchecks#healthcheck-timeout>.

## Failure meaning

- `healthcheckTimeout: null` plus no documented platform default: decision becomes OPEN; re-query the
  current Railway contract before the next deployment.
- A future explicit variable or service setting: record that value as the new effective bound and
  remove the inherited-default claim.
- `/api/healthz` does not return 200 before the effective bound: the deployment must fail promotion;
  investigate startup/database readiness instead of increasing the timeout without evidence.
