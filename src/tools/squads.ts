import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, uuidList, tagList } from './helpers.js';

export function registerSquadTools(
    server: McpServer,
    client: RemnawaveClient,
    readonly: boolean,
) {
    server.tool(
        'squads_list',
        'List all internal squads',
        {},
        async () => {
            try {
                const result = await client.getInternalSquads();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_accessible_nodes',
        'Get nodes accessible to a specific squad',
        {
            uuid: z.string().uuid().describe('Squad UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getSquadAccessibleNodes(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool('squads_get', 'Get one internal squad by UUID: inbounds, member and inbound counts', {
        uuid: z.string().uuid().describe('Squad UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getInternalSquadByUuid(uuid)); } catch (e) { return toolError(e); }
    });

    server.tool('squads_tags_list', 'List all tags used by internal squads', {}, async () => {
        try { return toolResult(await client.getInternalSquadTags()); } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    server.tool(
        'squads_create',
        'Create a new internal squad',
        {
            name: z.string().describe('Squad name'),
            inbounds: z.array(z.string().uuid()).describe('Array of inbound UUIDs'),
        },
        async (params) => {
            try {
                const result = await client.createInternalSquad(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_update',
        'Update an internal squad',
        {
            uuid: z.string().uuid().describe('Squad UUID'),
            name: z.string().optional().describe('New squad name'),
            // ⚠️ ЗАМЕНА, НЕ ДОБАВЛЕНИЕ: переданный список полностью вытесняет прежний.
            // Пустой массив оставит сквад без инбаундов — его пользователи молча перестанут
            // получать узлы в подписке. Сперва squads_list, потом полный новый список.
            inbounds: uuidList
                .optional()
                .describe('Inbound UUIDs for this squad — REPLACES the current list entirely'),
        },
        async (params) => {
            try {
                const result = await client.updateInternalSquad(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_delete',
        'Delete an internal squad',
        {
            uuid: z.string().uuid().describe('Squad UUID to delete'),
        },
        async ({ uuid }) => {
            try {
                await client.deleteInternalSquad(uuid);
                return toolResult({
                    success: true,
                    message: `Squad ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_add_users',
        'Add the listed users to an internal squad',
        {
            squadUuid: z.string().uuid().describe('Squad UUID'),
            userIds: z
                .array(z.number())
                .describe('Numeric user IDs to add (API 3.x has no user uuid)'),
        },
        async ({ squadUuid, userIds }) => {
            try {
                const result = await client.addUsersToSquad(squadUuid, userIds);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_remove_users',
        'Remove the listed users from an internal squad',
        {
            squadUuid: z.string().uuid().describe('Squad UUID'),
            userIds: z
                .array(z.number())
                .describe('Numeric user IDs to remove (API 3.x has no user uuid)'),
        },
        async ({ squadUuid, userIds }) => {
            try {
                const result = await client.removeUsersFromSquad(squadUuid, userIds);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // Действия над всем парком вынесены в отдельные тулзы с говорящими именами:
    // в API это те же bulk-actions/add-users и remove-users, которые легко
    // принять за «добавить перечисленных» — они не принимают списка вообще.
    server.tool(
        'squads_add_all_users',
        'DANGER: add EVERY user of the panel to an internal squad',
        {
            squadUuid: z.string().uuid().describe('Squad UUID'),
        },
        async ({ squadUuid }) => {
            try {
                return toolResult(await client.addAllUsersToSquad(squadUuid));
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'squads_remove_all_users',
        'DANGER: remove EVERY user from an internal squad',
        {
            squadUuid: z.string().uuid().describe('Squad UUID'),
        },
        async ({ squadUuid }) => {
            try {
                return toolResult(await client.removeAllUsersFromSquad(squadUuid));
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool('squads_set_tags', 'Set tags of one internal squad — REPLACES its whole tag set', {
        uuid: z.string().uuid().describe('Squad UUID'),
        tags: tagList.describe('Tags, up to 10: A-Z, 0-9, _ and : only, each up to 36 chars; [] clears'),
    }, async (params) => {
        try { return toolResult(await client.setInternalSquadTags(params)); } catch (e) { return toolError(e); }
    });

    server.tool('squads_reorder', 'Reorder internal squads', {
        items: z.array(z.object({
            viewPosition: z.number().int().describe('Sort position (0-based)'),
            uuid: z.string().uuid().describe('UUID'),
        })).describe('Ordered array of { viewPosition, uuid } objects'),
    }, async (params) => {
        try { return toolResult(await client.reorderInternalSquads(params)); } catch (e) { return toolError(e); }
    });
}
