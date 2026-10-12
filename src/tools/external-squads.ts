import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, tagList } from './helpers.js';

export function registerExternalSquadTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool('external_squads_list', 'List all external squads', {}, async () => {
        try { return toolResult(await client.getExternalSquads()); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_get', 'Get an external squad by UUID', {
        uuid: z.string().uuid().describe('Squad UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getExternalSquadByUuid(uuid)); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_tags_list', 'List all tags used by external squads', {}, async () => {
        try { return toolResult(await client.getExternalSquadTags()); } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    server.tool('external_squads_create', 'Create a new external squad', {
        name: z.string().describe('Squad name'),
    }, async (params) => {
        try { return toolResult(await client.createExternalSquad(params)); } catch (e) { return toolError(e); }
    });

    const remarkList = z.array(z.string()).min(1);
    // Внешний сквад переопределяет для своих людей настройки подписки: шаблоны, заголовки,
    // HWID, подписи-заглушки, страницу подписки. Непереданное поле панель не трогает.
    server.tool('external_squads_update', 'Update an external squad: name, per-squad templates, subscription settings, host overrides, response headers, HWID policy, custom remarks, subscription page config. Unpassed fields stay as they are', {
        uuid: z.string().uuid().describe('Squad UUID'),
        name: z.string().min(2).max(30).optional().describe('New squad name, 2-30 chars'),
        templates: z
            .array(z.object({
                templateUuid: z.string().uuid().describe('Subscription template UUID'),
                templateType: z.enum(['XRAY_JSON', 'XRAY_BASE64', 'MIHOMO', 'STASH', 'CLASH', 'SINGBOX']).describe('Template type'),
            }))
            .optional()
            .describe('Templates this squad gets instead of the defaults, one per type — REPLACES the list'),
        subscriptionSettings: z
            .object({
                serveJsonAtBaseSubscription: z.boolean().optional(),
                isShowCustomRemarks: z.boolean().optional(),
                randomizeHosts: z.boolean().optional(),
            })
            .optional()
            .describe('Subscription settings overridden for this squad'),
        hostOverrides: z
            .object({
                serverDescription: z.string().max(30).nullish().describe('Server description shown in clients, null to clear'),
                vlessRouteId: z.number().int().min(0).max(65535).nullish().describe('VLESS route ID, null to clear'),
            })
            .optional()
            .describe('Host fields overridden for this squad'),
        responseHeadersAdd: z.record(z.string(), z.string()).optional().describe('Response headers added to subscription responses for this squad'),
        responseHeadersRemove: z.array(z.string()).optional().describe('Response header names removed for this squad'),
        hwidSettings: z
            .object({
                enabled: z.boolean(),
                fallbackDeviceLimit: z.number().describe('Device limit for users without their own'),
                maxDevicesAnnounce: z.string().max(200).nullable().describe('Message when the limit is hit, null for none'),
            })
            .nullish()
            .describe('HWID policy for this squad (all three fields), null to use the global one'),
        customRemarks: z
            .object({
                expiredUsers: remarkList,
                limitedUsers: remarkList,
                disabledUsers: remarkList,
                emptyHosts: remarkList,
                HWIDMaxDevicesExceeded: remarkList,
                HWIDNotSupported: remarkList,
            })
            .nullish()
            .describe('Custom remarks for this squad (all six lists), null to use the global ones'),
        subpageConfigUuid: z.string().uuid().nullish().describe('Subscription page config UUID, null for the default'),
    }, async (params) => {
        try { return toolResult(await client.updateExternalSquad(params)); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_delete', 'Delete an external squad', {
        uuid: z.string().uuid().describe('Squad UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteExternalSquad(uuid); return toolResult({ success: true, message: `Squad ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    // У внешних сквадов поштучных действий в 3.x нет — только над всем парком.
    server.tool('external_squads_add_all_users', 'DANGER: add EVERY user of the panel to an external squad', {
        squadUuid: z.string().uuid().describe('Squad UUID'),
    }, async ({ squadUuid }) => {
        try { return toolResult(await client.addAllUsersToExternalSquad(squadUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_remove_all_users', 'DANGER: remove EVERY user from an external squad', {
        squadUuid: z.string().uuid().describe('Squad UUID'),
    }, async ({ squadUuid }) => {
        try { return toolResult(await client.removeAllUsersFromExternalSquad(squadUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_reorder', 'Reorder external squads', {
        items: z.array(z.object({
            viewPosition: z.number().describe('Sort position (0-based)'),
            uuid: z.string().uuid().describe('Squad UUID'),
        })).describe('Ordered array of { viewPosition, uuid } objects'),
    }, async (params) => {
        try { return toolResult(await client.reorderExternalSquads(params)); } catch (e) { return toolError(e); }
    });

    server.tool('external_squads_set_tags', 'Set tags of one external squad — REPLACES its whole tag set', {
        uuid: z.string().uuid().describe('UUID'),
        tags: tagList.describe('Tags, up to 10: A-Z, 0-9, _ and : only, each up to 36 chars; [] clears'),
    }, async (params) => {
        try { return toolResult(await client.setExternalSquadTags(params)); } catch (e) { return toolError(e); }
    });
}
