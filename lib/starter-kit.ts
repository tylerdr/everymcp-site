import { featuredMcps } from "@/lib/mcps";

export const starterKitFilename = "everymcp-mcp-integration-starter-kit.md";

const catalogSelectionRows = featuredMcps
  .slice(0, 6)
  .map(
    (mcp) =>
      `| ${mcp.name} | ${mcp.useCase} | ${mcp.source} | ${mcp.repo} | ${mcp.installation} |`
  )
  .join("\n");

const catalogSelectionNotes = featuredMcps
  .slice(0, 6)
  .map((mcp) => `- **${mcp.name}** — ${mcp.description} Use cases in the catalog: ${mcp.useCases.join(", ")}.`)
  .join("\n");

export const starterKit = `# EveryMCP MCP Integration Starter Kit

This packet turns one MCP integration idea into a bounded selection, setup, and rollout decision. It uses the current EveryMCP catalog as a starting point; it does not replace source review or a provider's current installation instructions.

## 1. Choose the first workflow

Write one sentence that names the trigger, the MCP server, the data boundary, and the expected result.

- Workflow owner:
- User or team:
- Trigger:
- Expected result and measurable acceptance signal:
- Systems the server must read:
- Systems the server may write:
- Data that must never leave the approved boundary:
- Human approval required before a write:

Use the decision rule below before opening a credentialed connection:

1. If the workflow needs public research or source discovery, start with a search/research listing and keep credentials read-only.
2. If it needs repository context, compare Git and GitHub listings; choose Git for local repository actions and GitHub for hosted issues, pull requests, and metadata.
3. If it needs local files, choose Filesystem and write the exact allowed directories into the client configuration.
4. If it needs database data, choose a database listing and require a least-privilege role plus a read-only first pass.
5. If none of those signals fit, stop and record the missing capability instead of granting a broad token.

## 2. Current catalog selection matrix

These rows are generated from the featured MCP records in EveryMCP's committed catalog. Follow each linked repository or registry source before installation; catalog inclusion is an indexed reference, not a security audit or endorsement.

| Listing | Primary use case | Catalog source | Repository | Installation note |
| --- | --- | --- | --- | --- |
${catalogSelectionRows}

${catalogSelectionNotes}

Record the selected listing, source URL, evaluated commit/version, and why the alternatives were rejected:

- Selected slug:
- Source URL:
- Evaluated version or commit:
- Alternatives considered:
- Selection reason:
- Open source, compatibility, or maintenance questions:

## 3. Source and permission review

For the selected repository or registry record, capture the answers before you add a token:

- Who publishes and maintains it?
- Which protocol and client transports are supported today?
- Which tools are exposed, and which can write or delete?
- Which credentials, scopes, network destinations, filesystem paths, and data stores are requested?
- Where will credentials live, and who can rotate or revoke them?
- What is the evaluated repository commit or package version?
- What evidence would make you stop the rollout?

EveryMCP listings are source-linked references. They are not publisher verification, vulnerability review, compatibility guarantees, or a promise that the source is current after this packet was generated.

## 4. Worked client configuration example

The Filesystem MCP listing in the current catalog says to define allowed directories and run the server from the MCP runtime. This example shows a narrow client configuration shape with one approved directory. Confirm the package name and current command in the linked source before running it.

\`\`\`json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/absolute/path/to/approved-directory"
      ]
    }
  }
}
\`\`\`

For a credentialed server, keep the secret in the client or deployment secret store rather than committing it:

\`\`\`json
{
  "mcpServers": {
    "selected-server": {
      "command": "REPLACE_WITH_SOURCE_INSTRUCTIONS",
      "args": ["REPLACE_WITH_SOURCE_INSTRUCTIONS"],
      "env": {
        "REQUIRED_SECRET_NAME": "REPLACE_WITH_SECRET_REFERENCE"
      }
    }
  }
}
\`\`\`

## 5. Boundary and rollout record

| Boundary | Decision |
| --- | --- |
| Allowed tools | |
| Read-only or write-capable | |
| Approved data sources | |
| Approved destinations | |
| Allowed filesystem paths or database schemas | |
| Human approval required before writes | |
| Logs and retention | |
| Kill switch or rollback owner | |

Start in an isolated development environment with synthetic data. Keep write access disabled until the read-only path passes. Pin the evaluated version or commit and record every credential or permission change.

## 6. Repeatable validation assets

Run these checks with the selected server and record evidence rather than a checkbox alone:

1. **Discovery:** the client sees only the intended server and tools.
2. **Boundary:** a synthetic request cannot read outside the approved source or write to an unapproved destination.
3. **Authentication:** missing, expired, and rotated credentials fail without exposing the secret.
4. **Expected result:** one labeled synthetic input produces the recorded expected output.
5. **Negative case:** an unauthorized tool, path, record, or write request is rejected.
6. **Resilience:** timeout, provider 4xx, provider 5xx, and malformed input produce a bounded error and a retry or rollback decision.
7. **Observability:** logs contain the request outcome and correlation reference without credentials or customer data.
8. **Repeatability:** the same pinned version and input produce the same acceptance result.

Record commands, fixtures, timestamps, and output excerpts here:

- Discovery evidence:
- Boundary evidence:
- Authentication evidence:
- Expected output:
- Negative-case output:
- Retry/error output:
- Log review:

## 7. Acceptance and rollback

- Discovery result:
- Authentication result:
- Read-only test result:
- Write test result, if explicitly approved:
- Expected output:
- Observed output:
- Error and retry behavior:
- Rollback command or disable action:
- Rollback result:
- Reviewer and date:

The integration is ready for real data only when the owner can explain what it can do, where it can act, how it fails, and how to stop it. If a provider changes its source instructions or permissions, repeat this review.

## What this paid packet includes

- A decision tree for the first workflow
- A current catalog-based selection matrix and source links
- A worked narrow Filesystem client configuration example
- A secret-safe generic client configuration template
- Source, credential, permission, boundary, validation, retry, and rollback records

This is a self-serve reference packet delivered as a download after a successful checkout return. It does not include managed implementation, third-party security verification, provider credentials, durable entitlement recovery after a lost checkout return, or a promise that any listed server remains current.
`;
