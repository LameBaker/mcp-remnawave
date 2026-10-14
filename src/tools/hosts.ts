import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, tagList, uuidList } from './helpers.js';

const SUBSCRIPTION_TYPES = ['XRAY_JSON', 'XRAY_BASE64', 'MIHOMO', 'STASH', 'CLASH', 'SINGBOX'] as const;

/**
 * Тонкая настройка хоста — поля, которые есть в контракте и create, и update. Объекты Xray
 * (xhttp extra, mux, sockopt, finalmask) панель принимает как есть, null снимает настройку.
 */
const hostAdvancedFields = {
    xhttpExtraParams: z.unknown().optional().describe('XHTTP "extra" object for this host, null to clear'),
    muxParams: z.unknown().optional().describe('Xray mux settings object, null to clear'),
    sockoptParams: z.unknown().optional().describe('Xray sockopt settings object, null to clear'),
    finalMask: z.unknown().optional().describe('Xray finalmask object, null to clear'),
    pinnedPeerCertSha256: z.string().nullish().describe('Pinned peer certificate SHA-256, null to clear'),
    verifyPeerCertByName: z.string().nullish().describe('Verify peer certificate by this name, null to clear'),
    mihomoIpVersion: z
        .enum(['dual', 'ipv4', 'ipv6', 'ipv4-prefer', 'ipv6-prefer'])
        .nullish()
        .describe('Mihomo ip-version for this host, null for default'),
    mapper: z
        .record(z.string(), z.unknown())
        .optional()
        .describe('Per-host outbound mapper: {xrayJson: [ {op:"copy"|"unset"|..., from, to} ], ...} — see the panel docs'),
};

export function registerHostTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool(
        'hosts_list',
        'List all Remnawave hosts',
        {},
        async () => {
            try {
                const result = await client.getHosts();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_get',
        'Get a specific host by UUID',
        {
            uuid: z.string().uuid().describe('Host UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getHostByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_tags_list',
        'List all host tags',
        {},
        async () => {
            try {
                const result = await client.getHostTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (readonly) return;

    server.tool(
        'hosts_create',
        'Create a new host in Remnawave',
        {
            remark: z.string().describe('Host remark/name'),
            address: z.string().describe('Host address'),
            port: z.number().describe('Host port'),
            configProfileUuid: z
                .string()
                .describe('Config profile UUID'),
            configProfileInboundUuid: z
                .string()
                .describe('Config profile inbound UUID'),
            path: z.string().optional().describe('URL path'),
            sni: z.string().optional().describe('SNI (Server Name Indication)'),
            host: z.string().optional().describe('Host header'),
            alpn: z
                .enum(['h3', 'h2', 'http/1.1', 'h2,http/1.1', 'h3,h2,http/1.1', 'h3,h2'])
                .optional()
                .describe('ALPN protocol'),
            fingerprint: z
                .enum([
                    'chrome',
                    'firefox',
                    'safari',
                    'ios',
                    'android',
                    'edge',
                    'qq',
                    'random',
                    'randomized',
                ])
                .optional()
                .describe('TLS fingerprint'),
            isDisabled: z
                .boolean()
                .optional()
                .describe('Create in disabled state'),
            isHidden: z
                .boolean()
                .optional()
                .describe('Hide from subscription list'),
            securityLayer: z
                .enum(['DEFAULT', 'TLS', 'NONE'])
                .optional()
                .describe('Security layer'),
            tags: tagList
                .optional()
                .describe('Host tags. Panel accepts A-Z, 0-9, _ and : only'),
            serverDescription: z
                .string()
                .optional()
                .describe('Server description'),
            nodes: uuidList
                .optional()
                .describe('Array of node UUIDs to assign'),
            excludeFromSubscriptionTypes: z
                .array(z.enum(SUBSCRIPTION_TYPES))
                .optional()
                .describe('Subscription types to exclude this host from'),
            xrayJsonTemplateUuid: z
                .string()
                .optional()
                .describe('Xray JSON template UUID'),
            // 3.4: список «исключить из сквадов» стал правилом с режимом. Прежнее поле
            // `excludedInternalSquads` панель 3.4 молча отбрасывает.
            internalSquads: z
                .object({
                    mode: z.enum(['EXCLUDE', 'ALLOW_ONLY']).describe('EXCLUDE — hide from these squads; ALLOW_ONLY — show only to them'),
                    squads: uuidList.describe('Internal squad UUIDs'),
                })
                .optional()
                .describe('Which internal squads see this host'),
            overrideSniFromAddress: z
                .boolean()
                .optional()
                .describe('Override SNI from address'),
            keepSniBlank: z
                .boolean()
                .optional()
                .describe('Keep SNI field blank'),
            vlessRouteId: z
                .number()
                .optional()
                .describe('VLESS route ID (0-65535)'),
            shuffleHost: z
                .boolean()
                .optional()
                .describe('Enable host shuffling'),
            mihomoX25519: z
                .boolean()
                .optional()
                .describe('Enable Mihomo X25519'),
            ...hostAdvancedFields,
        },
        async (params) => {
            try {
                const body: Record<string, unknown> = {
                    remark: params.remark,
                    address: params.address,
                    port: params.port,
                    inbound: {
                        configProfileUuid: params.configProfileUuid,
                        configProfileInboundUuid:
                            params.configProfileInboundUuid,
                    },
                };
                if (params.path !== undefined) body.path = params.path;
                if (params.sni !== undefined) body.sni = params.sni;
                if (params.host !== undefined) body.host = params.host;
                if (params.alpn !== undefined) body.alpn = params.alpn;
                if (params.fingerprint !== undefined)
                    body.fingerprint = params.fingerprint;
                if (params.isDisabled !== undefined)
                    body.isDisabled = params.isDisabled;
                if (params.isHidden !== undefined)
                    body.isHidden = params.isHidden;
                if (params.securityLayer !== undefined)
                    body.securityLayer = params.securityLayer;
                if (params.tags !== undefined) body.tags = params.tags;
                if (params.serverDescription !== undefined)
                    body.serverDescription = params.serverDescription;
                if (params.nodes !== undefined) body.nodes = params.nodes;
                if (params.excludeFromSubscriptionTypes !== undefined)
                    body.excludeFromSubscriptionTypes = params.excludeFromSubscriptionTypes;
                if (params.xrayJsonTemplateUuid !== undefined)
                    body.xrayJsonTemplateUuid = params.xrayJsonTemplateUuid;
                if (params.internalSquads !== undefined)
                    body.internalSquads = params.internalSquads;
                for (const key of Object.keys(hostAdvancedFields) as (keyof typeof hostAdvancedFields)[]) {
                    if (params[key] !== undefined) body[key] = params[key];
                }
                if (params.overrideSniFromAddress !== undefined)
                    body.overrideSniFromAddress = params.overrideSniFromAddress;
                if (params.keepSniBlank !== undefined)
                    body.keepSniBlank = params.keepSniBlank;
                if (params.vlessRouteId !== undefined)
                    body.vlessRouteId = params.vlessRouteId;
                if (params.shuffleHost !== undefined)
                    body.shuffleHost = params.shuffleHost;
                if (params.mihomoX25519 !== undefined)
                    body.mihomoX25519 = params.mihomoX25519;

                const result = await client.createHost(body);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_update',
        'Update an existing host',
        {
            uuid: z.string().uuid().describe('Host UUID to update'),
            remark: z.string().optional().describe('New remark/name'),
            address: z.string().optional().describe('New address'),
            port: z.number().optional().describe('New port'),
            configProfileUuid: z.string().optional().describe('New config profile UUID'),
            configProfileInboundUuid: z.string().optional().describe('New config profile inbound UUID'),
            // null у полей ниже сбрасывает их (path, sni, host — к значению инбаунда): тело
            // собирается поверх текущего хоста, и без явного null сбросить поле было нельзя.
            path: z.string().nullish().describe('New URL path, null to inherit from the inbound'),
            sni: z.string().nullish().describe('New SNI, null to inherit from the inbound'),
            host: z.string().nullish().describe('New host header, null to inherit from the inbound'),
            alpn: z
                .enum(['h3', 'h2', 'http/1.1', 'h2,http/1.1', 'h3,h2,http/1.1', 'h3,h2'])
                .nullish()
                .describe('New ALPN, null to clear'),
            fingerprint: z
                .enum([
                    'chrome',
                    'firefox',
                    'safari',
                    'ios',
                    'android',
                    'edge',
                    'qq',
                    'random',
                    'randomized',
                ])
                .nullish()
                .describe('New fingerprint, null to clear'),
            isDisabled: z
                .boolean()
                .optional()
                .describe('Enable/disable host'),
            isHidden: z
                .boolean()
                .optional()
                .describe('Hide from subscription list'),
            securityLayer: z
                .enum(['DEFAULT', 'TLS', 'NONE'])
                .optional()
                .describe('New security layer'),
            tags: tagList
                .optional()
                .describe('New tags (replaces the whole set). Panel accepts A-Z, 0-9, _ and : only'),
            serverDescription: z
                .string()
                .nullish()
                .describe('New server description, null to clear'),
            nodes: uuidList
                .optional()
                .describe('New node UUIDs'),
            excludeFromSubscriptionTypes: z
                .array(z.enum(SUBSCRIPTION_TYPES))
                .optional()
                .describe('Subscription types to exclude this host from'),
            xrayJsonTemplateUuid: z
                .string()
                .nullish()
                .describe('Xray JSON template UUID, null for the default template'),
            // 3.4: список «исключить из сквадов» стал правилом с режимом. Прежнее поле
            // `excludedInternalSquads` панель 3.4 молча отбрасывает.
            internalSquads: z
                .object({
                    mode: z.enum(['EXCLUDE', 'ALLOW_ONLY']).describe('EXCLUDE — hide from these squads; ALLOW_ONLY — show only to them'),
                    squads: uuidList.describe('Internal squad UUIDs'),
                })
                .optional()
                .describe('Which internal squads see this host'),
            overrideSniFromAddress: z
                .boolean()
                .optional()
                .describe('Override SNI from address'),
            keepSniBlank: z
                .boolean()
                .optional()
                .describe('Keep SNI field blank'),
            vlessRouteId: z
                .number()
                .nullish()
                .describe('VLESS route ID (0-65535), null to clear'),
            shuffleHost: z
                .boolean()
                .optional()
                .describe('Enable host shuffling'),
            mihomoX25519: z
                .boolean()
                .optional()
                .describe('Enable Mihomo X25519'),
            ...hostAdvancedFields,
        },
        async (params) => {
            try {
                const { uuid, configProfileUuid, configProfileInboundUuid, ...fields } = params;

                // Панель трактует ключи, отсутствующие в PATCH, как сброс в дефолт:
                // обновление одного remark снимало у хостов isDisabled, и выключенные
                // хосты уезжали в подписку. Поэтому тело собирается поверх текущего
                // состояния хоста, а не из одних переданных полей.
                const current = (await client.getHostByUuid(uuid)) as {
                    response?: Record<string, unknown>;
                };
                const host = current?.response;
                if (!host) {
                    throw new Error(`Host ${uuid} not found, refusing to update blindly`);
                }

                // viewPosition возвращается панелью, но телом update не принимается.
                const { viewPosition: _viewPosition, ...merged } = host;
                const body: Record<string, unknown> = { ...merged, uuid };
                // У хоста, чей профиль или инбаунд удалён, uuid в inbound — null, а тело требует
                // строки: возврат как есть ронял бы любую правку именно такого хоста, которого и
                // надо перепривязать. То же с правилом ALLOW_ONLY без сквадов — контракт его не
                // принимает. Непереданное — не шлём, панель оставит как было.
                const hostInbound = host.inbound as Record<string, unknown> | null | undefined;
                if (!hostInbound?.configProfileUuid || !hostInbound?.configProfileInboundUuid) {
                    delete body.inbound;
                }
                const squads = host.internalSquads as { mode?: string; squads?: unknown[] } | null | undefined;
                if (!squads || (squads.mode === 'ALLOW_ONLY' && !squads.squads?.length)) {
                    delete body.internalSquads;
                }
                // Явный null проходит в тело как есть — так поле сбрасывается.
                for (const [key, value] of Object.entries(fields)) {
                    if (value !== undefined) body[key] = value;
                }
                if (configProfileUuid !== undefined || configProfileInboundUuid !== undefined) {
                    const inbound = (host.inbound ?? {}) as Record<string, unknown>;
                    body.inbound = {
                        configProfileUuid: configProfileUuid ?? inbound.configProfileUuid,
                        configProfileInboundUuid:
                            configProfileInboundUuid ?? inbound.configProfileInboundUuid,
                    };
                }

                const result = await client.updateHost(body);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_delete',
        'Delete a host from Remnawave',
        {
            uuid: z.string().uuid().describe('Host UUID to delete'),
        },
        async ({ uuid }) => {
            try {
                await client.deleteHost(uuid);
                return toolResult({
                    success: true,
                    message: `Host ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_bulk_enable',
        'Bulk enable selected hosts',
        { uuids: z.array(z.string().uuid()).describe('Array of host UUIDs') },
        async (params) => {
            try { return toolResult(await client.bulkEnableHosts(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_disable',
        'Bulk disable selected hosts',
        { uuids: z.array(z.string().uuid()).describe('Array of host UUIDs') },
        async (params) => {
            try { return toolResult(await client.bulkDisableHosts(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_delete',
        'Bulk delete selected hosts',
        { uuids: z.array(z.string().uuid()).describe('Array of host UUIDs') },
        async (params) => {
            try { return toolResult(await client.bulkDeleteHosts(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_set_inbound',
        'Bulk set inbound for selected hosts',
        {
            uuids: z.array(z.string().uuid()).describe('Array of host UUIDs'),
            configProfileUuid: z.string().uuid().describe('Config profile UUID'),
            configProfileInboundUuid: z.string().uuid().describe('Inbound UUID'),
        },
        // Инбаунд в контракте — вложенный объект `inbound`. Плоские поля панель отбрасывала,
        // и тул отвечал успехом, ничего не меняя (найдено check:requests).
        async ({ uuids, configProfileUuid, configProfileInboundUuid }) => {
            try {
                return toolResult(await client.bulkSetHostInbound({
                    uuids,
                    inbound: { configProfileUuid, configProfileInboundUuid },
                }));
            } catch (e) { return toolError(e); }
        },
    );

    // Общий вариант двух тулов выше: те же правки сразу для многих хостов. Панель меняет только
    // переданные поля, остальное у каждого хоста остаётся своим — в отличие от одиночного PATCH.
    server.tool(
        'hosts_bulk_update',
        'Bulk update selected hosts: only the passed fields change, each host keeps the rest',
        {
            uuids: uuidList.min(1).describe('Host UUIDs to update'),
            configProfileUuid: z.string().uuid().optional().describe('New config profile UUID (pass together with configProfileInboundUuid)'),
            configProfileInboundUuid: z.string().uuid().optional().describe('New inbound UUID (pass together with configProfileUuid)'),
            remark: z.string().min(1).max(100).optional().describe('New remark'),
            address: z.string().optional().describe('New address'),
            port: z.number().int().optional().describe('New port'),
            path: z.string().nullish().describe('URL path, null to clear'),
            sni: z.string().nullish().describe('SNI, null to clear'),
            host: z.string().nullish().describe('Host header, null to clear'),
            alpn: z.enum(['h3', 'h2', 'http/1.1', 'h2,http/1.1', 'h3,h2,http/1.1', 'h3,h2']).nullish().describe('ALPN, null to clear'),
            fingerprint: z.string().nullish().describe('TLS fingerprint, null to clear'),
            isDisabled: z.boolean().optional().describe('Disable hosts'),
            isHidden: z.boolean().optional().describe('Hide hosts from subscriptions'),
            securityLayer: z.enum(['DEFAULT', 'TLS', 'NONE']).optional().describe('Security layer'),
            serverDescription: z.string().max(30).nullish().describe('Server description, null to clear'),
            tags: tagList.optional().describe('Host tags (REPLACES the set). A-Z, 0-9, _ and : only'),
            nodes: uuidList.optional().describe('Node UUIDs (REPLACES the set)'),
            internalSquads: z
                .object({
                    mode: z.enum(['EXCLUDE', 'ALLOW_ONLY']),
                    squads: uuidList,
                })
                .optional()
                .describe('Which internal squads see these hosts'),
            excludeFromSubscriptionTypes: z.array(z.enum(SUBSCRIPTION_TYPES)).optional().describe('Subscription types to exclude these hosts from'),
            xrayJsonTemplateUuid: z.string().uuid().nullish().describe('Xray JSON template UUID, null to clear'),
            overrideSniFromAddress: z.boolean().optional().describe('Override SNI from address'),
            keepSniBlank: z.boolean().optional().describe('Keep SNI blank'),
            vlessRouteId: z.number().int().min(0).max(65535).nullish().describe('VLESS route ID, null to clear'),
            shuffleHost: z.boolean().optional().describe('Enable host shuffling'),
            mihomoX25519: z.boolean().optional().describe('Enable Mihomo X25519'),
            ...hostAdvancedFields,
        },
        async ({ configProfileUuid, configProfileInboundUuid, ...fields }) => {
            try {
                const body: Record<string, unknown> = { ...fields };
                if (configProfileUuid !== undefined || configProfileInboundUuid !== undefined) {
                    if (!configProfileUuid || !configProfileInboundUuid) {
                        throw new Error('configProfileUuid and configProfileInboundUuid must be passed together');
                    }
                    body.inbound = { configProfileUuid, configProfileInboundUuid };
                }
                return toolResult(await client.bulkUpdateHosts(body));
            } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_set_port',
        'Bulk set port for selected hosts',
        {
            uuids: z.array(z.string().uuid()).describe('Array of host UUIDs'),
            port: z.number().describe('New port number'),
        },
        async (params) => {
            try { return toolResult(await client.bulkSetHostPort(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_clone',
        'Clone a host: a copy with the same settings, to tweak with hosts_update',
        {
            cloneFromUuid: z.string().uuid().describe('Host UUID to clone'),
        },
        async (params) => {
            try { return toolResult(await client.cloneHost(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_reorder',
        'Reorder hosts — the order hosts appear in subscriptions',
        {
            hosts: z
                .array(z.object({
                    viewPosition: z.number().int().describe('Sort position (0-based)'),
                    uuid: z.string().uuid().describe('Host UUID'),
                }))
                .describe('Ordered array of { viewPosition, uuid } objects'),
        },
        async (params) => {
            try { return toolResult(await client.reorderHosts(params)); } catch (e) { return toolError(e); }
        },
    );
}
