# mcp-remnawave

[English](#english) | [Русский](#русский)

---

<a id="english"></a>

## MCP Server for Remnawave Panel

MCP server ([Model Context Protocol](https://modelcontextprotocol.io)) providing LLM clients (Claude Desktop, Cursor, Windsurf, etc.) with tools to manage a [Remnawave](https://github.com/remnawave/) VPN panel.

**Version:** 1.2.0 | **Remnawave API:** 2.7.4

### Features

<!-- generated:count-en -->
- **208 tools** — users, nodes, hosts, subscriptions, squads, HWID, config profiles, inbounds, API tokens, billing, snippets, external squads, settings, subscription page configs and templates, node plugins and shared lists, node integrations, IP control and geocheck, metadata, bandwidth stats
- **Readonly mode** — restrict to 97 read-only tools for safe monitoring
<!-- /generated:count-en -->
- **3 resources** — real-time panel stats, node status, health checks
- **5 prompts** — guided workflows for common tasks
- **Caddy support** — `X-Api-Key` header for panels behind Caddy with custom path
- **Type-safe** — built on [@remnawave/backend-contract](https://www.npmjs.com/package/@remnawave/backend-contract) for API route validation
- **stdio transport** — works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible client

### Requirements

- Node.js >= 22
- Remnawave panel with API token (Settings > API Tokens)

### Installation

```bash
git clone https://github.com/TrackLine/mcp-remnawave.git
cd mcp-remnawave
npm install
npm run build
```

### Configuration

Create a `.env` file or pass environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `REMNAWAVE_BASE_URL` | Yes | Panel URL (e.g. `https://vpn.example.com`) |
| `REMNAWAVE_API_TOKEN` | Yes | API token from panel settings |
| `REMNAWAVE_API_KEY` | No | API key for Caddy reverse proxy authentication |
| `REMNAWAVE_READONLY` | No | Set to `true` to enable readonly mode |

```env
REMNAWAVE_BASE_URL=https://vpn.example.com
REMNAWAVE_API_TOKEN=your-api-token-here
```

### Caddy with Custom Path

If your Remnawave panel is deployed behind [Caddy with a custom path and API key protection](https://docs.remnawave.com/docs/security/caddy-with-custom-path/), set the base URL to include the custom path and provide the API key:

```env
REMNAWAVE_BASE_URL=https://example.com/your-secret-path/api
REMNAWAVE_API_KEY=your-caddy-api-key
```

The `X-Api-Key` header will be added to every request automatically.

### Readonly Mode

Set `REMNAWAVE_READONLY=true` to disable all write operations (create, update, delete, enable, disable, restart, revoke, reset). Only read/list tools will be registered.

Useful for monitoring dashboards or shared environments where you want to prevent accidental changes.

<!-- generated:readonly-en -->
In readonly mode, the available tools are reduced from 208 to 97:

| Category | Available tools |
|----------|----------------|
| Users (11) | `users_list`, `users_get`, `users_get_by_username`, `users_subscription_request_history`, `users_accessible_nodes`, `users_get_by_short_uuid`, `users_get_by_telegram_id`, `users_get_by_email`, `users_get_by_tag`, `users_tags_list`, `users_resolve` |
| Nodes (3) | `nodes_list`, `nodes_get`, `nodes_tags_list` |
| Hosts (3) | `hosts_list`, `hosts_get`, `hosts_tags_list` |
| System (13) | `system_stats`, `system_bandwidth_stats`, `system_stats_http`, `system_nodes_metrics`, `system_nodes_statistics`, `system_health`, `system_metadata`, `system_generate_x25519`, `auth_status`, `system_stats_recap`, `system_configuration`, `system_stats_digest`, `system_srr_matcher` |
| Subscriptions (10) | `subscriptions_list`, `subscriptions_get_by_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info`, `subscriptions_get_raw_by_short_uuid`, `subscriptions_get_subpage_config`, `subscriptions_get_connection_keys`, `subscription_request_history_list`, `subscription_request_history_stats` |
| Config Profiles & Inbounds (6) | `config_profiles_list`, `config_profiles_get`, `inbounds_list`, `config_profiles_get_inbounds`, `config_profiles_get_computed_config`, `config_profiles_tags_list` |
| Internal Squads (4) | `squads_list`, `squads_accessible_nodes`, `squads_get`, `squads_tags_list` |
| HWID Devices (4) | `hwid_devices_list`, `hwid_devices_list_all`, `hwid_stats`, `hwid_top_users` |
| API Tokens (2) | `api_tokens_list`, `api_tokens_scopes_list` |
| Keygen (1) | `keygen_get` |
| Infra Billing (4) | `billing_providers_list`, `billing_provider_get`, `billing_nodes_list`, `billing_history_list` |
| Snippets (1) | `snippets_list` |
| External Squads (3) | `external_squads_list`, `external_squads_get`, `external_squads_tags_list` |
| Settings (2) | `settings_get`, `subscription_settings_get` |
| Subscription Page Configs (3) | `sub_page_configs_list`, `sub_page_configs_get`, `sub_page_configs_tags_list` |
| Subscription Templates (3) | `subscription_templates_list`, `subscription_templates_get`, `subscription_templates_tags_list` |
| Node Plugins & Shared Lists (7) | `node_plugins_list`, `node_plugins_get`, `node_plugins_torrent_reports`, `node_plugins_torrent_stats`, `node_plugins_tags_list`, `shared_lists_list`, `shared_lists_get` |
| Node Integrations (2) | `node_integrations_list`, `node_integrations_get` |
| IP Control & Geocheck (6) | `ip_control_fetch_ips`, `ip_control_get_fetch_ips_result`, `ip_control_fetch_users_ips`, `ip_control_get_fetch_users_ips_result`, `ip_control_geocheck_start`, `ip_control_get_geocheck_result` |
| Metadata (2) | `metadata_node_get`, `metadata_user_get` |
| Bandwidth Stats (7) | `bandwidth_nodes_usage`, `bandwidth_nodes_top_users`, `bandwidth_user_usage`, `bandwidth_squad_usage`, `bandwidth_squad_user_usage`, `bandwidth_nodes_users_usage`, `bandwidth_nodes_group_top_users` |
<!-- /generated:readonly-en -->

### Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/absolute/path/to/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "your-api-token-here",
        "REMNAWAVE_API_KEY": "your-caddy-api-key",
        "REMNAWAVE_READONLY": "false"
      }
    }
  }
}
```

### Usage with Cursor / Windsurf

Add to `.cursor/mcp.json` or `.windsurf/mcp.json` in your project:

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/absolute/path/to/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "your-api-token-here",
        "REMNAWAVE_API_KEY": "your-caddy-api-key",
        "REMNAWAVE_READONLY": "false"
      }
    }
  }
}
```

### Docker

```bash
npm run build
docker compose up -d
```

Environment variables are passed via `.env` file or `docker-compose.yml`.

### Available Tools

<!-- generated:tools-en -->
#### Users (29 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `users_list` | List all Remnawave VPN users with pagination, field filters and sorting | read |
| `users_get` | Get a specific Remnawave user by their numeric ID | read |
| `users_get_by_username` | Get a Remnawave user by their username | read |
| `users_subscription_request_history` | Subscription request history of one user: which client fetched the config, when, from which IP | read |
| `users_accessible_nodes` | Which nodes this user can actually reach, broken down by squad and inbound — answers "why is this location missing for him" without walking squads by hand | read |
| `users_get_by_short_uuid` | Get a Remnawave user by their short UUID | read |
| `users_get_by_telegram_id` | Get a Remnawave user by their Telegram ID | read |
| `users_get_by_email` | Get a Remnawave user by their email | read |
| `users_get_by_tag` | Get Remnawave users by tag | read |
| `users_tags_list` | List all user tags | read |
| `users_resolve` | Resolve a user to {id, username, shortUuid} by exactly one of: numeric ID, short UUID, username | read |
| `users_create` | Create a new VPN user in Remnawave | write |
| `users_update` | Update an existing Remnawave user | write |
| `users_delete` | Permanently delete a Remnawave user | write |
| `users_enable` | Enable a disabled Remnawave user (restore VPN access) | write |
| `users_disable` | Disable a Remnawave user (block VPN access) | write |
| `users_revoke_subscription` | Revoke subscription for a Remnawave user (generates new subscription link) | write |
| `users_reset_traffic` | Reset traffic counter for a Remnawave user | write |
| `users_bulk_delete_by_status` | Bulk delete users by status | write |
| `users_bulk_update` | Bulk update selected users | write |
| `users_bulk_reset_traffic` | Bulk reset traffic for selected users | write |
| `users_bulk_revoke_subscription` | Bulk revoke subscriptions for selected users | write |
| `users_bulk_delete` | Bulk delete selected users | write |
| `users_bulk_update_squads` | Bulk update squad assignments for selected users | write |
| `users_bulk_extend_expiration` | Bulk extend expiration date for selected users | write |
| `users_bulk_all_update` | Update ALL users at once | write |
| `users_bulk_all_reset_traffic` | Reset traffic counters for ALL users | write |
| `users_bulk_all_extend_expiration` | Extend expiration date for ALL users | write |
| `users_extend` | Extend one user's expiration date by N days | write |

#### Nodes (15 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `nodes_list` | List all Remnawave nodes | read |
| `nodes_get` | Get a specific node by UUID | read |
| `nodes_tags_list` | List all node tags | read |
| `nodes_create` | Create a new node in Remnawave | write |
| `nodes_update` | Update an existing node | write |
| `nodes_delete` | Delete a node from Remnawave. The panel removes it asynchronously: the node may stay in nodes_list for a while, and its config profile cannot be deleted until it is gone | write |
| `nodes_enable` | Enable a disabled node | write |
| `nodes_disable` | Disable a node | write |
| `nodes_restart` | Restart a specific node. Causes ~12s of downtime on :443 for that node when forceRestart is true | write |
| `nodes_restart_all` | DANGER: restarts EVERY node in the panel at once. With forceRestart=true this takes the whole fleet down for ~12s simultaneously — prefer restarting nodes one by one with nodes_restart | write |
| `nodes_reset_traffic` | Reset traffic counter for a node | write |
| `nodes_reorder` | Reorder nodes by providing an ordered array of node positions | write |
| `nodes_bulk_profile_modification` | Bulk modify config profile for selected nodes | write |
| `nodes_bulk_actions` | Bulk actions on selected nodes (enable/disable/restart/reset traffic) | write |
| `nodes_bulk_update` | Bulk update properties for selected nodes | write |

#### Hosts (14 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `hosts_list` | List all Remnawave hosts | read |
| `hosts_get` | Get a specific host by UUID | read |
| `hosts_tags_list` | List all host tags | read |
| `hosts_create` | Create a new host in Remnawave | write |
| `hosts_update` | Update an existing host | write |
| `hosts_delete` | Delete a host from Remnawave | write |
| `hosts_bulk_enable` | Bulk enable selected hosts | write |
| `hosts_bulk_disable` | Bulk disable selected hosts | write |
| `hosts_bulk_delete` | Bulk delete selected hosts | write |
| `hosts_bulk_set_inbound` | Bulk set inbound for selected hosts | write |
| `hosts_bulk_update` | Bulk update selected hosts: only the passed fields change, each host keeps the rest | write |
| `hosts_bulk_set_port` | Bulk set port for selected hosts | write |
| `hosts_clone` | Clone a host: a copy with the same settings, to tweak with hosts_update | write |
| `hosts_reorder` | Reorder hosts — the order hosts appear in subscriptions | write |

#### System (13 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `system_stats` | Get overall Remnawave panel statistics (users, nodes, traffic, memory, CPU) | read |
| `system_bandwidth_stats` | Get bandwidth statistics (last 24h / 7d / 30d buckets) | read |
| `system_stats_http` | Get HTTP request counts per route and method — what actually hits the panel API | read |
| `system_nodes_metrics` | Get detailed node metrics | read |
| `system_nodes_statistics` | Get node statistics | read |
| `system_health` | Check Remnawave panel health status | read |
| `system_metadata` | Get Remnawave panel metadata and version information | read |
| `system_generate_x25519` | Generate X25519 key pair for VLESS Reality | read |
| `auth_status` | Check current authentication status with Remnawave panel | read |
| `system_stats_recap` | Get system statistics recap | read |
| `system_configuration` | Panel configuration from its environment: which notifications, webhooks and integrations are enabled and their thresholds | read |
| `system_stats_digest` | Digest for a time range: users created and expired, traffic total and by new users, and more | read |
| `system_srr_matcher` | Test subscription request routing rules | read |

#### Subscriptions (10 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `subscriptions_list` | List all subscriptions with pagination | read |
| `subscriptions_get_by_id` | Get subscription details by numeric user ID | read |
| `subscriptions_get_by_username` | Get subscription details by username | read |
| `subscriptions_get_by_short_uuid` | Get subscription details by short UUID | read |
| `subscription_info` | Get subscription info by short UUID (public endpoint) | read |
| `subscriptions_get_raw_by_short_uuid` | Get raw subscription config by short UUID | read |
| `subscriptions_get_subpage_config` | Get subscription page configuration as it would be served to a client presenting the given headers (the panel runs them through the subscription-response-rules matcher) | read |
| `subscriptions_get_connection_keys` | Get connection keys for a subscription | read |
| `subscription_request_history_list` | List subscription request history (paginated; filter by userId to see one user) | read |
| `subscription_request_history_stats` | Get subscription request history statistics | read |

#### Config Profiles & Inbounds (11 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `config_profiles_list` | List all config profiles | read |
| `config_profiles_get` | Get a config profile by UUID | read |
| `inbounds_list` | List all inbounds from all config profiles | read |
| `config_profiles_get_inbounds` | Get inbounds for a specific config profile | read |
| `config_profiles_get_computed_config` | Get computed configuration for a config profile | read |
| `config_profiles_tags_list` | List all tags used by config profiles | read |
| `config_profiles_create` | Create a new config profile | write |
| `config_profiles_update` | Update a config profile | write |
| `config_profiles_delete` | Delete a config profile. A profile still used by a node cannot be deleted; after nodes_delete wait until the node disappears from nodes_list (deletion is asynchronous) | write |
| `config_profiles_reorder` | Reorder config profiles | write |
| `config_profiles_set_tags` | Set tags of one config profile — REPLACES its whole tag set | write |

#### Internal Squads (13 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `squads_list` | List all internal squads | read |
| `squads_accessible_nodes` | Get nodes accessible to a specific squad | read |
| `squads_get` | Get one internal squad by UUID: inbounds, member and inbound counts | read |
| `squads_tags_list` | List all tags used by internal squads | read |
| `squads_create` | Create a new internal squad | write |
| `squads_update` | Update an internal squad | write |
| `squads_delete` | Delete an internal squad | write |
| `squads_add_users` | Add the listed users to an internal squad | write |
| `squads_remove_users` | Remove the listed users from an internal squad | write |
| `squads_add_all_users` | DANGER: add EVERY user of the panel to an internal squad | write |
| `squads_remove_all_users` | DANGER: remove EVERY user from an internal squad | write |
| `squads_set_tags` | Set tags of one internal squad — REPLACES its whole tag set | write |
| `squads_reorder` | Reorder internal squads | write |

#### HWID Devices (7 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `hwid_devices_list` | List HWID devices for a specific user | read |
| `hwid_devices_list_all` | List all HWID devices across all users (paginated: pass size to get more than the default 25) | read |
| `hwid_stats` | Get HWID device statistics | read |
| `hwid_top_users` | Get users with most HWID devices (paginated: pass size, default is only 5) | read |
| `hwid_device_create` | Create a HWID device entry for a user | write |
| `hwid_device_delete` | Delete a specific HWID device | write |
| `hwid_devices_delete_all` | Delete all HWID devices for a user | write |

#### API Tokens (4 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `api_tokens_list` | List all API tokens | read |
| `api_tokens_scopes_list` | List API token scopes: resources, their read/write scopes and the endpoints each one opens — use before api_tokens_create to grant less than "*" | read |
| `api_tokens_create` | Create a new API token | write |
| `api_tokens_delete` | Delete an API token | write |

#### Keygen (1 tool)

| Tool | Description | Mode |
|------|-------------|------|
| `keygen_get` | Generate a new SECRET_KEY for node configuration | read |

#### Infra Billing (12 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `billing_providers_list` | List all infrastructure billing providers | read |
| `billing_provider_get` | Get a billing provider by UUID | read |
| `billing_nodes_list` | List all billing nodes | read |
| `billing_history_list` | List billing history (paginated: pass size to get more than the default page) | read |
| `billing_provider_create` | Create a new billing provider | write |
| `billing_provider_update` | Update a billing provider | write |
| `billing_provider_delete` | Delete a billing provider | write |
| `billing_node_create` | Create a billing node | write |
| `billing_node_update` | Update a billing node | write |
| `billing_node_delete` | Delete a billing node | write |
| `billing_history_create` | Create a billing history entry | write |
| `billing_history_delete` | Delete a billing history entry | write |

#### Snippets (5 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `snippets_list` | List all configuration snippets | read |
| `snippets_create` | Create a new configuration snippet | write |
| `snippets_update` | Update an existing snippet | write |
| `snippets_delete` | Delete a snippet by name | write |
| `snippets_sync` | Push a snippet to the nodes whose configs use it now | write |

#### External Squads (10 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `external_squads_list` | List all external squads | read |
| `external_squads_get` | Get an external squad by UUID | read |
| `external_squads_tags_list` | List all tags used by external squads | read |
| `external_squads_create` | Create a new external squad | write |
| `external_squads_update` | Update an external squad: name, per-squad templates, subscription settings, host overrides, response headers, HWID policy, custom remarks, subscription page config. Unpassed fields stay as they are | write |
| `external_squads_delete` | Delete an external squad | write |
| `external_squads_add_all_users` | DANGER: add EVERY user of the panel to an external squad | write |
| `external_squads_remove_all_users` | DANGER: remove EVERY user from an external squad | write |
| `external_squads_reorder` | Reorder external squads | write |
| `external_squads_set_tags` | Set tags of one external squad — REPLACES its whole tag set | write |

#### Settings (4 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `settings_get` | Get Remnawave panel settings | read |
| `subscription_settings_get` | Get subscription settings: custom response headers, custom remarks, SRR response rules, HWID settings | read |
| `settings_update` | Update Remnawave panel settings: passkeySettings, oauth2Settings, passwordSettings, brandingSettings. Pass only what changes — it is merged into the current section. DANGER: auth sections can lock admins out of the panel | write |
| `subscription_settings_update` | Update subscription settings. Only the fields you pass change; everything else is preserved | write |

#### Subscription Page Configs (9 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `sub_page_configs_list` | List all subscription page configurations | read |
| `sub_page_configs_get` | Get a subscription page config by UUID | read |
| `sub_page_configs_tags_list` | List all tags used by subscription page configs | read |
| `sub_page_configs_create` | Create a subscription page configuration | write |
| `sub_page_configs_update` | Update a subscription page configuration | write |
| `sub_page_configs_delete` | Delete a subscription page configuration | write |
| `sub_page_configs_reorder` | Reorder subscription page configurations | write |
| `sub_page_configs_clone` | Clone a subscription page configuration | write |
| `sub_page_configs_set_tags` | Set tags of one subscription page config — REPLACES its whole tag set | write |

#### Subscription Templates (8 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `subscription_templates_list` | List subscription templates (mihomo, xray-json, ...) with body sizes instead of bodies | read |
| `subscription_templates_get` | Get one subscription template. By default returns metadata and size only; pass saveToPath to write the body to a file, or includeContent to inline it | read |
| `subscription_templates_tags_list` | List all tags used by subscription templates | read |
| `subscription_templates_update_from_file` | Deploy a subscription template to the panel from a local file. Reads the file, picks the right field for the template type (base64 YAML or JSON) and PATCHes it — the body never passes through the model context | write |
| `subscription_templates_create` | Create an empty subscription template of a given type; fill it with subscription_templates_update_from_file | write |
| `subscription_templates_delete` | Delete a subscription template. Squads and hosts that reference it fall back to the default | write |
| `subscription_templates_reorder` | Reorder subscription templates | write |
| `subscription_templates_set_tags` | Set tags of one subscription template — REPLACES its whole tag set | write |

#### Node Plugins & Shared Lists (20 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `node_plugins_list` | List all node plugins | read |
| `node_plugins_get` | Get a node plugin by UUID | read |
| `node_plugins_torrent_reports` | Get torrent blocker reports (paginated: pass size to get more than the default 25) | read |
| `node_plugins_torrent_stats` | Get torrent blocker statistics | read |
| `node_plugins_tags_list` | List all tags used by node plugins | read |
| `shared_lists_list` | List node-plugin shared lists (name, type, item count) | read |
| `shared_lists_get` | Get one shared list with its config, by name | read |
| `node_plugins_create` | Create a new node plugin | write |
| `node_plugins_update` | Update a node plugin (name and/or pluginConfig) | write |
| `node_plugins_delete` | Delete a node plugin | write |
| `node_plugins_reorder` | Reorder node plugins | write |
| `node_plugins_clone` | Clone a node plugin | write |
| `node_plugins_execute` | Execute a node plugin with a command on target nodes | write |
| `node_plugins_torrent_truncate` | Truncate all torrent blocker reports | write |
| `node_plugins_set_tags` | Set tags of one node plugin — REPLACES its whole tag set | write |
| `node_plugins_sync` | Push a node plugin config to the nodes that use it now | write |
| `shared_lists_create` | Create a shared list | write |
| `shared_lists_update` | Replace a shared list config (the whole config, not a patch) | write |
| `shared_lists_delete` | Delete a shared list by name | write |
| `shared_lists_sync` | Push a shared list to the nodes that use it now | write |

#### Node Integrations (5 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `node_integrations_list` | List node integrations | read |
| `node_integrations_get` | Get a node integration by UUID | read |
| `node_integrations_create` | Create a node integration; attach it to nodes via integrationUuids in nodes_update | write |
| `node_integrations_update` | Update a node integration. Only the passed fields change | write |
| `node_integrations_delete` | Delete a node integration | write |

#### IP Control & Geocheck (7 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `ip_control_fetch_ips` | Fetch active IPs for a user (async job) | read |
| `ip_control_get_fetch_ips_result` | Get result of an IP fetch job | read |
| `ip_control_fetch_users_ips` | Fetch IPs for all users on a node (async job) | read |
| `ip_control_get_fetch_users_ips_result` | Get result of a users IP fetch job | read |
| `ip_control_geocheck_start` | Start a geolocation check of a node: how GeoIP databases see its IP (async job, returns jobId) | read |
| `ip_control_get_geocheck_result` | Get the result of a node geocheck job. The SVG report image is dropped unless saveImageToPath is given | read |
| `ip_control_drop_connections` | Drop active connections by IP or numeric user ID on specific/all nodes | write |

#### Metadata (4 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `metadata_node_get` | Get metadata for a specific node | read |
| `metadata_user_get` | Get metadata for a specific user | read |
| `metadata_node_upsert` | Create or update metadata for a node | write |
| `metadata_user_upsert` | Create or update metadata for a user | write |

#### Bandwidth Stats (7 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `bandwidth_nodes_usage` | Bandwidth per node over a period — which locations carry the traffic | read |
| `bandwidth_nodes_top_users` | Top users by traffic on one node over a period — who is consuming a specific location | read |
| `bandwidth_user_usage` | Bandwidth of one user over a period, split by node | read |
| `bandwidth_squad_usage` | Bandwidth of one internal squad over a period, per user (cursor-paginated) | read |
| `bandwidth_squad_user_usage` | Bandwidth of one user inside one internal squad over a period | read |
| `bandwidth_nodes_users_usage` | Per-user traffic over a period on a set of nodes, per node — raw totals in bytes | read |
| `bandwidth_nodes_group_top_users` | Top users by traffic across a set of nodes over a period, with a daily sparkline | read |
<!-- /generated:tools-en -->

### Resources

| URI | Description |
|-----|-------------|
| `remnawave://stats` | Current panel statistics |
| `remnawave://nodes` | All nodes status |
| `remnawave://health` | Panel health status |
| `remnawave://users/{userId}` | Specific user details (numeric ID) |

### Prompts

| Prompt | Description |
|--------|-------------|
| `create_user_wizard` | Step-by-step user creation guide |
| `node_diagnostics` | Node troubleshooting |
| `traffic_report` | Traffic usage report |
| `user_audit` | Complete user audit |
| `bulk_user_cleanup` | Find and manage expired users |

### Example Queries

```
"Show me all users with expired subscriptions"
"Create user vasya with 50 GB limit for one month"
"Restart node amsterdam-01"
"Give me a traffic report for the last week"
"Disable users who exceeded their traffic limit"
"Which nodes are offline right now?"
"Show billing history"
"List all node plugins"
"Get IP connections for user X"
```

### Project Structure

```
src/
├── index.ts                       # Entry point (stdio transport)
├── server.ts                      # McpServer setup
├── config.ts                      # Environment config
├── client/
│   └── index.ts                   # Remnawave HTTP client
├── tools/
│   ├── helpers.ts                 # Result formatting helpers
│   ├── annotate.ts                # Tool annotations + secret redaction
│   ├── index.ts                   # Tool registration
│   ├── users.ts                   # Users (29 tools)
│   ├── nodes.ts                   # Nodes (15 tools)
│   ├── hosts.ts                   # Hosts (14 tools)
│   ├── system.ts                  # System (13 tools)
│   ├── subscriptions.ts           # Subscriptions (10 tools)
│   ├── inbounds.ts                # Config Profiles & Inbounds (11 tools)
│   ├── squads.ts                  # Internal Squads (13 tools)
│   ├── hwid.ts                    # HWID Devices (7 tools)
│   ├── infra-billing.ts           # Infra Billing (12 tools)
│   ├── node-plugins.ts            # Node Plugins & Shared Lists (20 tools)
│   ├── external-squads.ts         # External Squads (10 tools)
│   ├── subscription-page-configs.ts # Subscription Page Configs (9 tools)
│   ├── ip-control.ts              # IP Control & Geocheck (7 tools)
│   ├── snippets.ts                # Snippets (5 tools)
│   ├── metadata.ts                # Metadata (4 tools)
│   ├── subscription-templates.ts  # Subscription Templates (8 tools)
│   ├── node-integrations.ts       # Node Integrations (5 tools)
│   ├── bandwidth-stats.ts         # Bandwidth Stats (7 tools)
│   ├── api-tokens.ts              # API Tokens (4 tools)
│   ├── settings.ts                # Settings (4 tools)
│   └── keygen.ts                  # Keygen (1 tool)
├── resources/
│   └── index.ts                   # MCP resources
└── prompts/
    └── index.ts                   # MCP prompts
```

### License

MIT

---

<a id="русский"></a>

## MCP-сервер для Remnawave Panel

MCP-сервер ([Model Context Protocol](https://modelcontextprotocol.io)), предоставляющий LLM-клиентам (Claude Desktop, Cursor, Windsurf и др.) инструменты для управления VPN-панелью [Remnawave](https://github.com/remnawave/).

**Версия:** 1.2.0 | **Remnawave API:** 2.7.4

### Возможности

<!-- generated:count-ru -->
- **208 инструментов** — пользователи, ноды, хосты, подписки, группы, HWID, конфиг-профили, inbounds, API-токены, биллинг, сниппеты, внешние группы, настройки, страницы и шаблоны подписок, плагины нод и общие списки, интеграции нод, IP-контроль и геопроверка, метаданные, статистика трафика
- **Readonly-режим** — ограничение до 97 инструментов только для чтения
<!-- /generated:count-ru -->
- **3 ресурса** — статистика панели, статус нод, проверка здоровья в реальном времени
- **5 промптов** — пошаговые сценарии для типичных задач
- **Поддержка Caddy** — заголовок `X-Api-Key` для панелей за Caddy с кастомным путём
- **Type-safe** — построен на [@remnawave/backend-contract](https://www.npmjs.com/package/@remnawave/backend-contract) для валидации API-маршрутов
- **stdio транспорт** — работает с Claude Desktop, Cursor, Windsurf и любым MCP-совместимым клиентом

### Требования

- Node.js >= 22
- Remnawave панель с API-токеном (Настройки > API Tokens)

### Установка

```bash
git clone https://github.com/TrackLine/mcp-remnawave.git
cd mcp-remnawave
npm install
npm run build
```

### Конфигурация

Создайте файл `.env` или передайте переменные окружения:

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `REMNAWAVE_BASE_URL` | Да | URL панели (например `https://vpn.example.com`) |
| `REMNAWAVE_API_TOKEN` | Да | API-токен из настроек панели |
| `REMNAWAVE_API_KEY` | Нет | API-ключ для аутентификации через Caddy reverse proxy |
| `REMNAWAVE_READONLY` | Нет | `true` для включения режима только чтения |

```env
REMNAWAVE_BASE_URL=https://vpn.example.com
REMNAWAVE_API_TOKEN=ваш-api-токен
```

### Caddy с кастомным путём

Если ваша панель Remnawave развёрнута за [Caddy с кастомным путём и защитой API-ключом](https://docs.remnawave.com/docs/security/caddy-with-custom-path/), укажите полный путь в base URL и предоставьте API-ключ:

```env
REMNAWAVE_BASE_URL=https://example.com/your-secret-path/api
REMNAWAVE_API_KEY=ваш-caddy-api-ключ
```

Заголовок `X-Api-Key` будет автоматически добавляться к каждому запросу.

### Режим Readonly

Установите `REMNAWAVE_READONLY=true`, чтобы отключить все операции записи (создание, обновление, удаление, включение, отключение, перезапуск, отзыв, сброс). Будут зарегистрированы только инструменты чтения.

Полезно для мониторинговых дашбордов или общих окружений, где нужно исключить случайные изменения.

<!-- generated:readonly-ru -->
В readonly-режиме количество доступных инструментов сокращается с 208 до 97:

| Категория | Доступные инструменты |
|-----------|----------------------|
| Пользователи (11) | `users_list`, `users_get`, `users_get_by_username`, `users_subscription_request_history`, `users_accessible_nodes`, `users_get_by_short_uuid`, `users_get_by_telegram_id`, `users_get_by_email`, `users_get_by_tag`, `users_tags_list`, `users_resolve` |
| Ноды (3) | `nodes_list`, `nodes_get`, `nodes_tags_list` |
| Хосты (3) | `hosts_list`, `hosts_get`, `hosts_tags_list` |
| Система (13) | `system_stats`, `system_bandwidth_stats`, `system_stats_http`, `system_nodes_metrics`, `system_nodes_statistics`, `system_health`, `system_metadata`, `system_generate_x25519`, `auth_status`, `system_stats_recap`, `system_configuration`, `system_stats_digest`, `system_srr_matcher` |
| Подписки (10) | `subscriptions_list`, `subscriptions_get_by_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info`, `subscriptions_get_raw_by_short_uuid`, `subscriptions_get_subpage_config`, `subscriptions_get_connection_keys`, `subscription_request_history_list`, `subscription_request_history_stats` |
| Конфиг-профили и Inbounds (6) | `config_profiles_list`, `config_profiles_get`, `inbounds_list`, `config_profiles_get_inbounds`, `config_profiles_get_computed_config`, `config_profiles_tags_list` |
| Внутренние группы (4) | `squads_list`, `squads_accessible_nodes`, `squads_get`, `squads_tags_list` |
| HWID-устройства (4) | `hwid_devices_list`, `hwid_devices_list_all`, `hwid_stats`, `hwid_top_users` |
| API-токены (2) | `api_tokens_list`, `api_tokens_scopes_list` |
| Keygen (1) | `keygen_get` |
| Биллинг инфраструктуры (4) | `billing_providers_list`, `billing_provider_get`, `billing_nodes_list`, `billing_history_list` |
| Сниппеты (1) | `snippets_list` |
| Внешние группы (3) | `external_squads_list`, `external_squads_get`, `external_squads_tags_list` |
| Настройки (2) | `settings_get`, `subscription_settings_get` |
| Страницы подписок (3) | `sub_page_configs_list`, `sub_page_configs_get`, `sub_page_configs_tags_list` |
| Шаблоны подписок (3) | `subscription_templates_list`, `subscription_templates_get`, `subscription_templates_tags_list` |
| Плагины нод и общие списки (7) | `node_plugins_list`, `node_plugins_get`, `node_plugins_torrent_reports`, `node_plugins_torrent_stats`, `node_plugins_tags_list`, `shared_lists_list`, `shared_lists_get` |
| Интеграции нод (2) | `node_integrations_list`, `node_integrations_get` |
| IP-контроль и геопроверка (6) | `ip_control_fetch_ips`, `ip_control_get_fetch_ips_result`, `ip_control_fetch_users_ips`, `ip_control_get_fetch_users_ips_result`, `ip_control_geocheck_start`, `ip_control_get_geocheck_result` |
| Метаданные (2) | `metadata_node_get`, `metadata_user_get` |
| Статистика трафика (7) | `bandwidth_nodes_usage`, `bandwidth_nodes_top_users`, `bandwidth_user_usage`, `bandwidth_squad_usage`, `bandwidth_squad_user_usage`, `bandwidth_nodes_users_usage`, `bandwidth_nodes_group_top_users` |
<!-- /generated:readonly-ru -->

### Использование с Claude Desktop

Добавьте в конфигурацию Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` на macOS):

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/абсолютный/путь/к/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "ваш-api-токен",
        "REMNAWAVE_API_KEY": "ваш-caddy-api-ключ",
        "REMNAWAVE_READONLY": "false"
      }
    }
  }
}
```

### Использование с Cursor / Windsurf

Добавьте в `.cursor/mcp.json` или `.windsurf/mcp.json` вашего проекта:

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/абсолютный/путь/к/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "ваш-api-токен",
        "REMNAWAVE_API_KEY": "ваш-caddy-api-ключ",
        "REMNAWAVE_READONLY": "false"
      }
    }
  }
}
```

### Docker

```bash
npm run build
docker compose up -d
```

Переменные окружения передаются через `.env` файл или `docker-compose.yml`.

### Доступные инструменты

<!-- generated:tools-ru -->
#### Пользователи (29 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `users_list` | List all Remnawave VPN users with pagination, field filters and sorting | read |
| `users_get` | Get a specific Remnawave user by their numeric ID | read |
| `users_get_by_username` | Get a Remnawave user by their username | read |
| `users_subscription_request_history` | Subscription request history of one user: which client fetched the config, when, from which IP | read |
| `users_accessible_nodes` | Which nodes this user can actually reach, broken down by squad and inbound — answers "why is this location missing for him" without walking squads by hand | read |
| `users_get_by_short_uuid` | Get a Remnawave user by their short UUID | read |
| `users_get_by_telegram_id` | Get a Remnawave user by their Telegram ID | read |
| `users_get_by_email` | Get a Remnawave user by their email | read |
| `users_get_by_tag` | Get Remnawave users by tag | read |
| `users_tags_list` | List all user tags | read |
| `users_resolve` | Resolve a user to {id, username, shortUuid} by exactly one of: numeric ID, short UUID, username | read |
| `users_create` | Create a new VPN user in Remnawave | write |
| `users_update` | Update an existing Remnawave user | write |
| `users_delete` | Permanently delete a Remnawave user | write |
| `users_enable` | Enable a disabled Remnawave user (restore VPN access) | write |
| `users_disable` | Disable a Remnawave user (block VPN access) | write |
| `users_revoke_subscription` | Revoke subscription for a Remnawave user (generates new subscription link) | write |
| `users_reset_traffic` | Reset traffic counter for a Remnawave user | write |
| `users_bulk_delete_by_status` | Bulk delete users by status | write |
| `users_bulk_update` | Bulk update selected users | write |
| `users_bulk_reset_traffic` | Bulk reset traffic for selected users | write |
| `users_bulk_revoke_subscription` | Bulk revoke subscriptions for selected users | write |
| `users_bulk_delete` | Bulk delete selected users | write |
| `users_bulk_update_squads` | Bulk update squad assignments for selected users | write |
| `users_bulk_extend_expiration` | Bulk extend expiration date for selected users | write |
| `users_bulk_all_update` | Update ALL users at once | write |
| `users_bulk_all_reset_traffic` | Reset traffic counters for ALL users | write |
| `users_bulk_all_extend_expiration` | Extend expiration date for ALL users | write |
| `users_extend` | Extend one user's expiration date by N days | write |

#### Ноды (15 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `nodes_list` | List all Remnawave nodes | read |
| `nodes_get` | Get a specific node by UUID | read |
| `nodes_tags_list` | List all node tags | read |
| `nodes_create` | Create a new node in Remnawave | write |
| `nodes_update` | Update an existing node | write |
| `nodes_delete` | Delete a node from Remnawave. The panel removes it asynchronously: the node may stay in nodes_list for a while, and its config profile cannot be deleted until it is gone | write |
| `nodes_enable` | Enable a disabled node | write |
| `nodes_disable` | Disable a node | write |
| `nodes_restart` | Restart a specific node. Causes ~12s of downtime on :443 for that node when forceRestart is true | write |
| `nodes_restart_all` | DANGER: restarts EVERY node in the panel at once. With forceRestart=true this takes the whole fleet down for ~12s simultaneously — prefer restarting nodes one by one with nodes_restart | write |
| `nodes_reset_traffic` | Reset traffic counter for a node | write |
| `nodes_reorder` | Reorder nodes by providing an ordered array of node positions | write |
| `nodes_bulk_profile_modification` | Bulk modify config profile for selected nodes | write |
| `nodes_bulk_actions` | Bulk actions on selected nodes (enable/disable/restart/reset traffic) | write |
| `nodes_bulk_update` | Bulk update properties for selected nodes | write |

#### Хосты (14 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `hosts_list` | List all Remnawave hosts | read |
| `hosts_get` | Get a specific host by UUID | read |
| `hosts_tags_list` | List all host tags | read |
| `hosts_create` | Create a new host in Remnawave | write |
| `hosts_update` | Update an existing host | write |
| `hosts_delete` | Delete a host from Remnawave | write |
| `hosts_bulk_enable` | Bulk enable selected hosts | write |
| `hosts_bulk_disable` | Bulk disable selected hosts | write |
| `hosts_bulk_delete` | Bulk delete selected hosts | write |
| `hosts_bulk_set_inbound` | Bulk set inbound for selected hosts | write |
| `hosts_bulk_update` | Bulk update selected hosts: only the passed fields change, each host keeps the rest | write |
| `hosts_bulk_set_port` | Bulk set port for selected hosts | write |
| `hosts_clone` | Clone a host: a copy with the same settings, to tweak with hosts_update | write |
| `hosts_reorder` | Reorder hosts — the order hosts appear in subscriptions | write |

#### Система (13 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `system_stats` | Get overall Remnawave panel statistics (users, nodes, traffic, memory, CPU) | read |
| `system_bandwidth_stats` | Get bandwidth statistics (last 24h / 7d / 30d buckets) | read |
| `system_stats_http` | Get HTTP request counts per route and method — what actually hits the panel API | read |
| `system_nodes_metrics` | Get detailed node metrics | read |
| `system_nodes_statistics` | Get node statistics | read |
| `system_health` | Check Remnawave panel health status | read |
| `system_metadata` | Get Remnawave panel metadata and version information | read |
| `system_generate_x25519` | Generate X25519 key pair for VLESS Reality | read |
| `auth_status` | Check current authentication status with Remnawave panel | read |
| `system_stats_recap` | Get system statistics recap | read |
| `system_configuration` | Panel configuration from its environment: which notifications, webhooks and integrations are enabled and their thresholds | read |
| `system_stats_digest` | Digest for a time range: users created and expired, traffic total and by new users, and more | read |
| `system_srr_matcher` | Test subscription request routing rules | read |

#### Подписки (10 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `subscriptions_list` | List all subscriptions with pagination | read |
| `subscriptions_get_by_id` | Get subscription details by numeric user ID | read |
| `subscriptions_get_by_username` | Get subscription details by username | read |
| `subscriptions_get_by_short_uuid` | Get subscription details by short UUID | read |
| `subscription_info` | Get subscription info by short UUID (public endpoint) | read |
| `subscriptions_get_raw_by_short_uuid` | Get raw subscription config by short UUID | read |
| `subscriptions_get_subpage_config` | Get subscription page configuration as it would be served to a client presenting the given headers (the panel runs them through the subscription-response-rules matcher) | read |
| `subscriptions_get_connection_keys` | Get connection keys for a subscription | read |
| `subscription_request_history_list` | List subscription request history (paginated; filter by userId to see one user) | read |
| `subscription_request_history_stats` | Get subscription request history statistics | read |

#### Конфиг-профили и Inbounds (11 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `config_profiles_list` | List all config profiles | read |
| `config_profiles_get` | Get a config profile by UUID | read |
| `inbounds_list` | List all inbounds from all config profiles | read |
| `config_profiles_get_inbounds` | Get inbounds for a specific config profile | read |
| `config_profiles_get_computed_config` | Get computed configuration for a config profile | read |
| `config_profiles_tags_list` | List all tags used by config profiles | read |
| `config_profiles_create` | Create a new config profile | write |
| `config_profiles_update` | Update a config profile | write |
| `config_profiles_delete` | Delete a config profile. A profile still used by a node cannot be deleted; after nodes_delete wait until the node disappears from nodes_list (deletion is asynchronous) | write |
| `config_profiles_reorder` | Reorder config profiles | write |
| `config_profiles_set_tags` | Set tags of one config profile — REPLACES its whole tag set | write |

#### Внутренние группы (13 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `squads_list` | List all internal squads | read |
| `squads_accessible_nodes` | Get nodes accessible to a specific squad | read |
| `squads_get` | Get one internal squad by UUID: inbounds, member and inbound counts | read |
| `squads_tags_list` | List all tags used by internal squads | read |
| `squads_create` | Create a new internal squad | write |
| `squads_update` | Update an internal squad | write |
| `squads_delete` | Delete an internal squad | write |
| `squads_add_users` | Add the listed users to an internal squad | write |
| `squads_remove_users` | Remove the listed users from an internal squad | write |
| `squads_add_all_users` | DANGER: add EVERY user of the panel to an internal squad | write |
| `squads_remove_all_users` | DANGER: remove EVERY user from an internal squad | write |
| `squads_set_tags` | Set tags of one internal squad — REPLACES its whole tag set | write |
| `squads_reorder` | Reorder internal squads | write |

#### HWID-устройства (7 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `hwid_devices_list` | List HWID devices for a specific user | read |
| `hwid_devices_list_all` | List all HWID devices across all users (paginated: pass size to get more than the default 25) | read |
| `hwid_stats` | Get HWID device statistics | read |
| `hwid_top_users` | Get users with most HWID devices (paginated: pass size, default is only 5) | read |
| `hwid_device_create` | Create a HWID device entry for a user | write |
| `hwid_device_delete` | Delete a specific HWID device | write |
| `hwid_devices_delete_all` | Delete all HWID devices for a user | write |

#### API-токены (4 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `api_tokens_list` | List all API tokens | read |
| `api_tokens_scopes_list` | List API token scopes: resources, their read/write scopes and the endpoints each one opens — use before api_tokens_create to grant less than "*" | read |
| `api_tokens_create` | Create a new API token | write |
| `api_tokens_delete` | Delete an API token | write |

#### Keygen (1 инструмент)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `keygen_get` | Generate a new SECRET_KEY for node configuration | read |

#### Биллинг инфраструктуры (12 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `billing_providers_list` | List all infrastructure billing providers | read |
| `billing_provider_get` | Get a billing provider by UUID | read |
| `billing_nodes_list` | List all billing nodes | read |
| `billing_history_list` | List billing history (paginated: pass size to get more than the default page) | read |
| `billing_provider_create` | Create a new billing provider | write |
| `billing_provider_update` | Update a billing provider | write |
| `billing_provider_delete` | Delete a billing provider | write |
| `billing_node_create` | Create a billing node | write |
| `billing_node_update` | Update a billing node | write |
| `billing_node_delete` | Delete a billing node | write |
| `billing_history_create` | Create a billing history entry | write |
| `billing_history_delete` | Delete a billing history entry | write |

#### Сниппеты (5 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `snippets_list` | List all configuration snippets | read |
| `snippets_create` | Create a new configuration snippet | write |
| `snippets_update` | Update an existing snippet | write |
| `snippets_delete` | Delete a snippet by name | write |
| `snippets_sync` | Push a snippet to the nodes whose configs use it now | write |

#### Внешние группы (10 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `external_squads_list` | List all external squads | read |
| `external_squads_get` | Get an external squad by UUID | read |
| `external_squads_tags_list` | List all tags used by external squads | read |
| `external_squads_create` | Create a new external squad | write |
| `external_squads_update` | Update an external squad: name, per-squad templates, subscription settings, host overrides, response headers, HWID policy, custom remarks, subscription page config. Unpassed fields stay as they are | write |
| `external_squads_delete` | Delete an external squad | write |
| `external_squads_add_all_users` | DANGER: add EVERY user of the panel to an external squad | write |
| `external_squads_remove_all_users` | DANGER: remove EVERY user from an external squad | write |
| `external_squads_reorder` | Reorder external squads | write |
| `external_squads_set_tags` | Set tags of one external squad — REPLACES its whole tag set | write |

#### Настройки (4 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `settings_get` | Get Remnawave panel settings | read |
| `subscription_settings_get` | Get subscription settings: custom response headers, custom remarks, SRR response rules, HWID settings | read |
| `settings_update` | Update Remnawave panel settings: passkeySettings, oauth2Settings, passwordSettings, brandingSettings. Pass only what changes — it is merged into the current section. DANGER: auth sections can lock admins out of the panel | write |
| `subscription_settings_update` | Update subscription settings. Only the fields you pass change; everything else is preserved | write |

#### Страницы подписок (9 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `sub_page_configs_list` | List all subscription page configurations | read |
| `sub_page_configs_get` | Get a subscription page config by UUID | read |
| `sub_page_configs_tags_list` | List all tags used by subscription page configs | read |
| `sub_page_configs_create` | Create a subscription page configuration | write |
| `sub_page_configs_update` | Update a subscription page configuration | write |
| `sub_page_configs_delete` | Delete a subscription page configuration | write |
| `sub_page_configs_reorder` | Reorder subscription page configurations | write |
| `sub_page_configs_clone` | Clone a subscription page configuration | write |
| `sub_page_configs_set_tags` | Set tags of one subscription page config — REPLACES its whole tag set | write |

#### Шаблоны подписок (8 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `subscription_templates_list` | List subscription templates (mihomo, xray-json, ...) with body sizes instead of bodies | read |
| `subscription_templates_get` | Get one subscription template. By default returns metadata and size only; pass saveToPath to write the body to a file, or includeContent to inline it | read |
| `subscription_templates_tags_list` | List all tags used by subscription templates | read |
| `subscription_templates_update_from_file` | Deploy a subscription template to the panel from a local file. Reads the file, picks the right field for the template type (base64 YAML or JSON) and PATCHes it — the body never passes through the model context | write |
| `subscription_templates_create` | Create an empty subscription template of a given type; fill it with subscription_templates_update_from_file | write |
| `subscription_templates_delete` | Delete a subscription template. Squads and hosts that reference it fall back to the default | write |
| `subscription_templates_reorder` | Reorder subscription templates | write |
| `subscription_templates_set_tags` | Set tags of one subscription template — REPLACES its whole tag set | write |

#### Плагины нод и общие списки (20 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `node_plugins_list` | List all node plugins | read |
| `node_plugins_get` | Get a node plugin by UUID | read |
| `node_plugins_torrent_reports` | Get torrent blocker reports (paginated: pass size to get more than the default 25) | read |
| `node_plugins_torrent_stats` | Get torrent blocker statistics | read |
| `node_plugins_tags_list` | List all tags used by node plugins | read |
| `shared_lists_list` | List node-plugin shared lists (name, type, item count) | read |
| `shared_lists_get` | Get one shared list with its config, by name | read |
| `node_plugins_create` | Create a new node plugin | write |
| `node_plugins_update` | Update a node plugin (name and/or pluginConfig) | write |
| `node_plugins_delete` | Delete a node plugin | write |
| `node_plugins_reorder` | Reorder node plugins | write |
| `node_plugins_clone` | Clone a node plugin | write |
| `node_plugins_execute` | Execute a node plugin with a command on target nodes | write |
| `node_plugins_torrent_truncate` | Truncate all torrent blocker reports | write |
| `node_plugins_set_tags` | Set tags of one node plugin — REPLACES its whole tag set | write |
| `node_plugins_sync` | Push a node plugin config to the nodes that use it now | write |
| `shared_lists_create` | Create a shared list | write |
| `shared_lists_update` | Replace a shared list config (the whole config, not a patch) | write |
| `shared_lists_delete` | Delete a shared list by name | write |
| `shared_lists_sync` | Push a shared list to the nodes that use it now | write |

#### Интеграции нод (5 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `node_integrations_list` | List node integrations | read |
| `node_integrations_get` | Get a node integration by UUID | read |
| `node_integrations_create` | Create a node integration; attach it to nodes via integrationUuids in nodes_update | write |
| `node_integrations_update` | Update a node integration. Only the passed fields change | write |
| `node_integrations_delete` | Delete a node integration | write |

#### IP-контроль и геопроверка (7 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `ip_control_fetch_ips` | Fetch active IPs for a user (async job) | read |
| `ip_control_get_fetch_ips_result` | Get result of an IP fetch job | read |
| `ip_control_fetch_users_ips` | Fetch IPs for all users on a node (async job) | read |
| `ip_control_get_fetch_users_ips_result` | Get result of a users IP fetch job | read |
| `ip_control_geocheck_start` | Start a geolocation check of a node: how GeoIP databases see its IP (async job, returns jobId) | read |
| `ip_control_get_geocheck_result` | Get the result of a node geocheck job. The SVG report image is dropped unless saveImageToPath is given | read |
| `ip_control_drop_connections` | Drop active connections by IP or numeric user ID on specific/all nodes | write |

#### Метаданные (4 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `metadata_node_get` | Get metadata for a specific node | read |
| `metadata_user_get` | Get metadata for a specific user | read |
| `metadata_node_upsert` | Create or update metadata for a node | write |
| `metadata_user_upsert` | Create or update metadata for a user | write |

#### Статистика трафика (7 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `bandwidth_nodes_usage` | Bandwidth per node over a period — which locations carry the traffic | read |
| `bandwidth_nodes_top_users` | Top users by traffic on one node over a period — who is consuming a specific location | read |
| `bandwidth_user_usage` | Bandwidth of one user over a period, split by node | read |
| `bandwidth_squad_usage` | Bandwidth of one internal squad over a period, per user (cursor-paginated) | read |
| `bandwidth_squad_user_usage` | Bandwidth of one user inside one internal squad over a period | read |
| `bandwidth_nodes_users_usage` | Per-user traffic over a period on a set of nodes, per node — raw totals in bytes | read |
| `bandwidth_nodes_group_top_users` | Top users by traffic across a set of nodes over a period, with a daily sparkline | read |
<!-- /generated:tools-ru -->

### Ресурсы

| URI | Описание |
|-----|----------|
| `remnawave://stats` | Текущая статистика панели |
| `remnawave://nodes` | Статус всех нод |
| `remnawave://health` | Состояние здоровья панели |
| `remnawave://users/{userId}` | Данные конкретного пользователя (числовой ID) |

### Промпты

| Промпт | Описание |
|--------|----------|
| `create_user_wizard` | Пошаговое создание пользователя |
| `node_diagnostics` | Диагностика ноды |
| `traffic_report` | Отчёт по трафику |
| `user_audit` | Полный аудит пользователя |
| `bulk_user_cleanup` | Поиск и управление просроченными пользователями |

### Примеры запросов

```
«Покажи мне всех пользователей с истёкшей подпиской»
«Создай пользователя vasya с лимитом 50 ГБ на месяц»
«Перезапусти ноду amsterdam-01»
«Дай отчёт по трафику за последнюю неделю»
«Отключи пользователей, которые превысили лимит трафика»
«Какие ноды сейчас офлайн?»
«Покажи историю биллинга»
«Список плагинов нод»
«Получи IP-соединения пользователя X»
```

### Структура проекта

```
src/
├── index.ts                       # Точка входа (stdio транспорт)
├── server.ts                      # Настройка McpServer
├── config.ts                      # Конфигурация окружения
├── client/
│   └── index.ts                   # HTTP-клиент Remnawave
├── tools/
│   ├── helpers.ts                 # Хелперы форматирования
│   ├── annotate.ts                # Аннотации тулов и вычистка секретов
│   ├── index.ts                   # Регистрация инструментов
│   ├── users.ts                   # Пользователи (29 инструментов)
│   ├── nodes.ts                   # Ноды (15 инструментов)
│   ├── hosts.ts                   # Хосты (14 инструментов)
│   ├── system.ts                  # Система (13 инструментов)
│   ├── subscriptions.ts           # Подписки (10 инструментов)
│   ├── inbounds.ts                # Конфиг-профили и Inbounds (11 инструментов)
│   ├── squads.ts                  # Внутренние группы (13 инструментов)
│   ├── hwid.ts                    # HWID-устройства (7 инструментов)
│   ├── infra-billing.ts           # Биллинг инфраструктуры (12 инструментов)
│   ├── node-plugins.ts            # Плагины нод и общие списки (20 инструментов)
│   ├── external-squads.ts         # Внешние группы (10 инструментов)
│   ├── subscription-page-configs.ts # Страницы подписок (9 инструментов)
│   ├── ip-control.ts              # IP-контроль и геопроверка (7 инструментов)
│   ├── snippets.ts                # Сниппеты (5 инструментов)
│   ├── metadata.ts                # Метаданные (4 инструмента)
│   ├── subscription-templates.ts  # Шаблоны подписок (8 инструментов)
│   ├── node-integrations.ts       # Интеграции нод (5 инструментов)
│   ├── bandwidth-stats.ts         # Статистика трафика (7 инструментов)
│   ├── api-tokens.ts              # API-токены (4 инструмента)
│   ├── settings.ts                # Настройки (4 инструмента)
│   └── keygen.ts                  # Keygen (1 инструмент)
├── resources/
│   └── index.ts                   # MCP-ресурсы
└── prompts/
    └── index.ts                   # MCP-промпты
```

### Лицензия

MIT
