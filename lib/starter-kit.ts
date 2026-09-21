export const starterKitFilename = "everymcp-mcp-integration-starter-kit.md";

export const starterKit = `# EveryMCP MCP Integration Starter Kit

Use this packet to choose, configure, and verify one MCP server before connecting it to an agent or production workflow.

## 1. Define the first workflow

- Workflow owner:
- User or team:
- Trigger and expected result:
- Systems the server must read:
- Systems the server may write:
- Data that must never leave the approved boundary:
- A measurable acceptance result:

Keep the first workflow narrow enough to test end to end. Record the one decision this integration should improve or automate.

## 2. Check the source before you install

- Start with the linked repository or the official MCP Registry record.
- Confirm the publisher, repository activity, protocol compatibility, license, and current installation instructions.
- List every requested credential, permission, network destination, filesystem path, and tool exposed by the server.
- Decide where credentials live and who can rotate or revoke them.
- Save the version or commit you evaluated so a later change is visible.

EveryMCP listings are indexed references. They are not security audits, publisher verification, compatibility guarantees, or endorsements.

## 3. Write the boundary

| Boundary | Decision |
| --- | --- |
| Allowed tools | |
| Read-only or write-capable | |
| Approved data sources | |
| Approved destinations | |
| Human approval required before writes | |
| Logs and retention | |
| Kill switch or rollback | |

Use the narrowest credentials and tool set that can complete the first workflow. Keep write access disabled until the read-only path passes its checks.

## 4. Configure a repeatable test

1. Pin the server version or commit.
2. Configure credentials through the deployment secret store.
3. Start the server in an isolated development environment.
4. Verify the client can discover only the intended tools.
5. Run a labeled synthetic input through the workflow.
6. Confirm the output against an expected result.
7. Inspect logs for credential, data-boundary, and error leakage.
8. Repeat the test after every version, credential, or permission change.

## 5. Acceptance record

- Discovery result:
- Authentication result:
- Read-only test result:
- Write test result, if approved:
- Expected output:
- Observed output:
- Error and retry behavior:
- Rollback result:
- Reviewer and date:

The integration is ready for real data only when the owner can explain what it can do, where it can act, how it fails, and how to stop it.

## What this kit includes

- A workflow definition worksheet
- Source and permission review prompts
- A tool-boundary record
- A repeatable test sequence
- An acceptance and rollback record

This is a self-serve reference packet. It does not include managed implementation, third-party security verification, provider credentials, or a promise that any listed server is current.
`;
