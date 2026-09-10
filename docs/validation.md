# Validation evidence, 2026-09-10

Commands: npm ci --ignore-scripts; npm test; npm audit --audit-level=moderate; npm run benchmark.

Search: 8 tests passed, including actual HTTP requests and official MCP SDK stdio. Audit: zero vulnerabilities. Three-document fixture, 1,000 queries: p50 0.0018 ms, p95 0.0039 ms. No semantic quality or production performance claim.
