# Evidence directory

Each worker writes one sanitized phase report and each reviewer writes a separate review report.
Reports must state the verdict, exact commands/exit codes, resource observations, evidence paths,
changed paths, and unresolved questions. Keep raw logs outside Git under
`orchestrator/logs/<runId>/`; never copy credentials, cookies, proxy passwords, MCP tokens, or
signed URLs into this directory.

The controller accepts a phase only when the report, handoff, worker result, and (when required)
review result all agree. A report can document `BLOCKED` or `NOT_RUN`; it must not imply a pass.

