# PR18 independent exact-head review

**Reviewed head:** `b8630a5c2b854df3d77581257959876919ae7cc1`.
**Reviewed base:** `80edfe403313ca17e63d9cf7a66b8cdd097d5b56`.
**Reviewer:** separate read-only agent `/root/pr18_independent_review`.
**Conclusion:** No blocking findings. Recommend approving the exact head.

- Independently confirmed [canonical run 37240814694](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694) and [observe job 111549047496](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694/job/111549047496): repository, main branch, workflow_dispatch, exact a3f2aff head, timestamps and successful conclusions match the committed metadata.
- Retrieved the actual GitHub job logs and independently recomputed canonical SHA-256 `2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347`, matching the committed receipt. The content hash alone does not authenticate origin.
- Independently reconstructed schema and inventory relationships: 616 routes, 615 legacy IDs, 585 URLs and 623 exact relationships. All 12 priority queue rows preserve receipt pointers, roles, original citations, curated notes, observations and unresolved findings.
- Ten focused read-only importer tests passed. Independently read the exact-head hosted logs: all 17 collector and 14 importer tests passed, including replay, immutable collision and symlink protection; dry run made zero requests. PR collection was skipped. No CI reruns requested.
- Reviewed stale/failed/unknown source semantics, separate last attempt/success, finding retention on recovery/expiry, deterministic imports and output protection. No accidental public publication, score, badge or capability pass was introduced.
- Public data, application, collector, schema and dependencies have no diff from the reviewed base. Assessment fields remain null, paid/model providers disabled and publication review-required. Reviewer changed no files or GitHub state; original checkout remained clean.

Limits: the review authenticates the recorded manual HTTP observations. It establishes neither MCP capability conformance nor scheduled-run proof. Release still requires matching production deployment/domain and public readback.
