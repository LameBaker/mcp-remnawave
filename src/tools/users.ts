import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, listQueryParams, userTag, uuidList } from './helpers.js';

export function registerUserTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool(
        'users_list',
        'List all Remnawave VPN users with pagination, field filters and sorting',
        listQueryParams,
        async (params) => {
            try {
                const result = await client.getUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get',
        'Get a specific Remnawave user by their numeric ID',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserById(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get_by_username',
        'Get a Remnawave user by their username',
        {
            username: z.string().describe('Username'),
        },
        async ({ username }) => {
            try {
                const result = await client.getUserByUsername(username);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_subscription_request_history',
        'Subscription request history of one user: which client fetched the config, when, from which IP',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserSubscriptionRequestHistory(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_accessible_nodes',
        'Which nodes this user can actually reach, broken down by squad and inbound — answers "why is this location missing for him" without walking squads by hand',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserAccessibleNodes(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get_by_short_uuid',
        'Get a Remnawave user by their short UUID',
        {
            shortUuid: z.string().describe('Short UUID'),
        },
        async ({ shortUuid }) => {
            try {
                const result = await client.getUserByShortUuid(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get_by_telegram_id',
        'Get a Remnawave user by their Telegram ID',
        {
            telegramId: z.string().describe('Telegram user ID'),
        },
        async ({ telegramId }) => {
            try {
                const result = await client.getUserByTelegramId(telegramId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get_by_email',
        'Get a Remnawave user by their email',
        {
            email: z.string().describe('User email'),
        },
        async ({ email }) => {
            try {
                const result = await client.getUserByEmail(email);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_get_by_tag',
        'Get Remnawave users by tag',
        {
            tag: z.string().describe('User tag'),
        },
        async ({ tag }) => {
            try {
                const result = await client.getUserByTag(tag);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_tags_list',
        'List all user tags',
        {},
        async () => {
            try {
                const result = await client.getUserTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_resolve',
        'Resolve a user to {id, username, shortUuid} by exactly one of: numeric ID, short UUID, username',
        {
            // В 3.x поиска по uuid нет — поле `uuid` панель отбрасывала, а требует РОВНО ОДИН ключ.
            id: z.number().optional().describe('User numeric ID'),
            shortUuid: z.string().optional().describe('Short UUID'),
            username: z.string().optional().describe('Username'),
        },
        async (params) => {
            try {
                const result = await client.resolveUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (readonly) return;

    server.tool(
        'users_create',
        'Create a new VPN user in Remnawave',
        {
            username: z.string().describe('Unique username'),
            expireAt: z.string().describe('Expiration date in ISO 8601 format'),
            trafficLimitBytes: z
                .number()
                .optional()
                .describe('Traffic limit in bytes (0 = unlimited)'),
            trafficLimitStrategy: z
                .enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING'])
                .optional()
                .describe('Traffic reset period'),
            status: z
                .enum(['ACTIVE', 'DISABLED'])
                .optional()
                .describe('Initial user status'),
            description: z.string().optional().describe('User description'),
            tag: userTag.nullish().describe('User tag for grouping: up to 16 chars, A-Z 0-9 _'),
            telegramId: z.number().nullish().describe('Telegram user ID'),
            email: z.string().email().nullish().describe('User email'),
            hwidDeviceLimit: z
                .number()
                .optional()
                .describe('Max number of HWID devices'),
            activeInternalSquads: uuidList
                .optional()
                .describe('Array of internal squad UUIDs'),
            externalSquadUuid: z.string().uuid().nullish().describe('External squad UUID'),
            // Учётные данные и даты задаются явно только при переносе людей из другой панели:
            // иначе подписка у них сменится. В 3.x своего `uuid` у пользователя нет — прежнее
            // поле `uuid` панель молча отбрасывала.
            shortUuid: z.string().optional().describe('Subscription short UUID — only when migrating a user, otherwise generated'),
            vlessUuid: z.string().uuid().optional().describe('VLESS credential — only when migrating, otherwise generated'),
            trojanPassword: z.string().min(8).max(32).optional().describe('Trojan password — only when migrating, otherwise generated'),
            ssPassword: z.string().min(8).max(32).optional().describe('Shadowsocks password — only when migrating, otherwise generated'),
            createdAt: z.string().optional().describe('Original creation date (ISO 8601) — only when migrating'),
            lastTrafficResetAt: z.string().optional().describe('Last traffic reset date (ISO 8601) — only when migrating'),
        },
        async (params) => {
            try {
                const result = await client.createUser(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_update',
        'Update an existing Remnawave user',
        {
            id: z.number().describe('Numeric user ID to update (API 3.x: update-user.command requires numeric id, not UUID)'),
            username: z.string().optional().describe('New username'),
            expireAt: z
                .string()
                .optional()
                .describe('New expiration date (ISO 8601)'),
            trafficLimitBytes: z
                .number()
                .optional()
                .describe('New traffic limit in bytes'),
            trafficLimitStrategy: z
                .enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING'])
                .optional()
                .describe('Traffic reset period'),
            status: z
                .enum(['ACTIVE', 'DISABLED'])
                .optional()
                .describe('User status'),
            description: z.string().nullish().describe('User description, null to clear'),
            tag: userTag.nullish().describe('User tag: up to 16 chars, A-Z 0-9 _; null to clear'),
            telegramId: z.number().nullish().describe('Telegram user ID, null to clear'),
            email: z.string().email().nullish().describe('User email, null to clear'),
            hwidDeviceLimit: z
                .number()
                .int()
                .nullish()
                .describe('Max HWID devices, null to fall back to the panel default'),
            activeInternalSquads: uuidList
                .optional()
                .describe('Internal squad UUIDs'),
            externalSquadUuid: z.string().uuid().nullish().describe('External squad UUID, null to detach'),
        },
        async (params) => {
            try {
                const result = await client.updateUser(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_delete',
        'Permanently delete a Remnawave user',
        {
            userId: z.string().describe('Numeric user ID to delete (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                await client.deleteUser(userId);
                return toolResult({ success: true, message: `User ${userId} deleted` });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_enable',
        'Enable a disabled Remnawave user (restore VPN access)',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.enableUser(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_disable',
        'Disable a Remnawave user (block VPN access)',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.disableUser(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_revoke_subscription',
        'Revoke subscription for a Remnawave user (generates new subscription link)',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.revokeUserSubscription(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_reset_traffic',
        'Reset traffic counter for a Remnawave user',
        {
            userId: z.string().describe('Numeric user ID (API 3.x has no user uuid)'),
        },
        async ({ userId }) => {
            try {
                const result = await client.resetUserTraffic(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_delete_by_status',
        'Bulk delete users by status',
        {
            status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).describe('User status to delete'),
        },
        async (params) => {
            try {
                const result = await client.bulkDeleteUsersByStatus(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_update',
        'Bulk update selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs to update (max 500)'),
            status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).optional().describe('New status'),
            expireAt: z.string().optional().describe('New expiration date (ISO 8601)'),
            trafficLimitBytes: z.number().optional().describe('New traffic limit'),
            trafficLimitStrategy: z.enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING']).optional().describe('Traffic reset period'),
            description: z.string().nullish().describe('User description, null to clear'),
            telegramId: z.number().nullish().describe('Telegram user ID, null to clear'),
            email: z.string().email().nullish().describe('User email, null to clear'),
            tag: userTag.nullish().describe('User tag: up to 16 chars, A-Z 0-9 _; null to clear'),
            hwidDeviceLimit: z.number().int().nullish().describe('Max HWID devices, null to fall back to the panel default'),
            externalSquadUuid: z.string().uuid().nullish().describe('External squad UUID, null to detach'),
        },
        async (params) => {
            try {
                const { userIds, ...fields } = params;
                const result = await client.bulkUpdateUsers({ userIds, fields });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_reset_traffic',
        'Bulk reset traffic for selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs (max 500)'),
        },
        async (params) => {
            try {
                const result = await client.bulkResetUsersTraffic(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_revoke_subscription',
        'Bulk revoke subscriptions for selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs (max 500)'),
        },
        async (params) => {
            try {
                const result = await client.bulkRevokeUsersSubscription(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_delete',
        'Bulk delete selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs to delete (max 500)'),
        },
        async (params) => {
            try {
                const result = await client.bulkDeleteUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_update_squads',
        'Bulk update squad assignments for selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs (max 500)'),
            activeInternalSquads: z.array(z.string().uuid()).describe('Squad UUIDs to assign'),
        },
        async (params) => {
            try {
                const result = await client.bulkUpdateUserSquads(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_extend_expiration',
        'Bulk extend expiration date for selected users',
        {
            userIds: z.array(z.number()).min(1).max(500).describe('Array of numeric user IDs (max 500)'),
            extendDays: z.number().describe('Number of days to extend'),
        },
        async (params) => {
            try {
                const result = await client.bulkExtendUsersExpiration(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_all_update',
        'Update ALL users at once',
        {
            status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).optional().describe('New status for all'),
            expireAt: z.string().optional().describe('New expiration date for all'),
            trafficLimitBytes: z.number().optional().describe('Traffic limit in bytes'),
            trafficLimitStrategy: z.enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING']).optional().describe('Traffic reset period'),
            description: z.string().nullish().describe('User description, null to clear'),
            telegramId: z.number().nullish().describe('Telegram user ID, null to clear'),
            email: z.string().email().nullish().describe('User email, null to clear'),
            tag: userTag.nullish().describe('User tag: up to 16 chars, A-Z 0-9 _; null to clear'),
            hwidDeviceLimit: z.number().int().nullish().describe('Max HWID devices, null to fall back to the panel default'),
        },
        async (params) => {
            try {
                const result = await client.bulkAllUpdateUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_all_reset_traffic',
        'Reset traffic counters for ALL users',
        {},
        async () => {
            try {
                const result = await client.bulkAllResetUsersTraffic();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'users_bulk_all_extend_expiration',
        'Extend expiration date for ALL users',
        {
            extendDays: z.number().describe('Number of days to extend'),
        },
        async (params) => {
            try {
                const result = await client.bulkAllExtendUsersExpiration(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // Поштучный вариант users_bulk_extend_expiration: дни прибавляются к текущей дате окончания.
    server.tool(
        'users_extend',
        'Extend one user\'s expiration date by N days',
        {
            userId: z.string().regex(/^\d+$/).describe('Numeric user ID (API 3.x has no user uuid)'),
            days: z.number().int().min(1).describe('Days to add to the current expiration date'),
        },
        async ({ userId, days }) => {
            try {
                const result = await client.extendUserExpiration(userId, days);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
