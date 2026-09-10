# Validation evidence, 2026-09-10

Commands: npm ci --ignore-scripts; npm test; npm audit --audit-level=moderate; npm run benchmark.

Search: 8 tests passed, including actual HTTP requests and official MCP SDK stdio. Audit: zero vulnerabilities. Three-document fixture, 1,000 queries: p50 0.0018 ms, p95 0.0039 ms. No semantic quality or production performance claim.

Followup: 9 tests pass including actual native RuVector cosine oracle. Hybrid p50 0.310 ms, p95 0.508 ms on the same three documents and 1000 queries. Hybrid is slower here and remains optional. The MCP now includes bounded opt-in validation and benchmark tools.

Final followup: 10 tests pass, including an operator-enabled MCP benchmark that executes the real benchmark and returns a verified digest receipt.
