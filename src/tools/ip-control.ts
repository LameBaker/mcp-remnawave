import { writeFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerIpControlTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    // ⚠️ В 3.x путь `connections/by-user/:userId` ждёт ЧИСЛОВОЙ id: UUID пользователя в 3.x нет
    // вовсе, а прежняя схема требовала именно его — тул не мог отработать ни разу.
    server.tool('ip_control_fetch_ips', 'Fetch active IPs for a user (async job)', {
        userId: z.string().regex(/^\d+$/).describe('Numeric user ID (API 3.x has no user uuid)'),
    }, async ({ userId }) => {
        try { return toolResult(await client.fetchIps(userId)); } catch (e) { return toolError(e); }
    });

    server.tool('ip_control_get_fetch_ips_result', 'Get result of an IP fetch job', {
        jobId: z.string().describe('Job ID from fetch_ips'),
    }, async ({ jobId }) => {
        try { return toolResult(await client.getFetchIpsResult(jobId)); } catch (e) { return toolError(e); }
    });

    server.tool('ip_control_fetch_users_ips', 'Fetch IPs for all users on a node (async job)', {
        nodeUuid: z.string().uuid().describe('Node UUID'),
    }, async ({ nodeUuid }) => {
        try { return toolResult(await client.fetchUsersIps(nodeUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('ip_control_get_fetch_users_ips_result', 'Get result of a users IP fetch job', {
        jobId: z.string().describe('Job ID from fetch_users_ips'),
    }, async ({ jobId }) => {
        try { return toolResult(await client.getFetchUsersIpsResult(jobId)); } catch (e) { return toolError(e); }
    });

    // Geocheck (3.3+): нода проверяет, как её IP видят внешние гео-базы. Как и выборка IP —
    // асинхронно: старт отдаёт jobId, результат забирается отдельно.
    server.tool('ip_control_geocheck_start', 'Start a geolocation check of a node: how GeoIP databases see its IP (async job, returns jobId)', {
        nodeUuid: z.string().uuid().describe('Node UUID'),
        ip: z.string().optional().describe('Check this source IP of the node instead of the default (not together with interface)'),
        interface: z.string().optional().describe('Check from this network interface of the node (not together with ip)'),
    }, async ({ nodeUuid, ...params }) => {
        try {
            // Контракт допускает только одно из двух — отказываем до запроса, с понятной причиной.
            if (params.ip && params.interface) throw new Error('Pass either ip or interface, not both');
            return toolResult(await client.startGeocheck(nodeUuid, params));
        } catch (e) { return toolError(e); }
    });

    // Картинка-отчёт приходит base64-SVG на десятки КБ — в контекст модели она не нужна:
    // по умолчанию вырезаем, по запросу пишем в файл.
    server.tool('ip_control_get_geocheck_result', 'Get the result of a node geocheck job. The SVG report image is dropped unless saveImageToPath is given', {
        jobId: z.string().describe('Job ID from ip_control_geocheck_start'),
        saveImageToPath: z.string().optional().describe('Absolute path to write the SVG report image to'),
    }, async ({ jobId, saveImageToPath }) => {
        try {
            const result = (await client.getGeocheckResult(jobId)) as {
                response?: { result?: { image?: { data?: string } | null } | null };
            };
            const report = result?.response?.result;
            const image = report?.image;
            if (report && image) {
                if (saveImageToPath && image.data) {
                    await writeFile(saveImageToPath, Buffer.from(image.data, 'base64'));
                }
                report.image = saveImageToPath
                    ? ({ savedTo: saveImageToPath } as never)
                    : ({ omitted: 'pass saveImageToPath to get the SVG' } as never);
            }
            return toolResult(result);
        } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    // ⚠️ В 3.x вариант `userUuids` заменён на `userIds` с числами — прежний вызов отклонялся
    // валидацией панели (найдено check:requests).
    server.tool('ip_control_drop_connections', 'Drop active connections by IP or numeric user ID on specific/all nodes', {
        dropBy: z.union([
            z.object({
                by: z.literal('ipAddresses'),
                ipAddresses: z.array(z.union([z.ipv4(), z.ipv6()])).min(1).describe('Array of IPv4/IPv6 addresses'),
            }),
            z.object({
                by: z.literal('userIds'),
                userIds: z.array(z.number().int()).min(1).describe('Array of numeric user IDs'),
            }),
        ]).describe('What to drop connections by'),
        targetNodes: z.union([
            z.object({
                target: z.literal('allNodes'),
            }),
            z.object({
                target: z.literal('specificNodes'),
                nodeUuids: z.array(z.string().uuid()).min(1).describe('Array of node UUIDs'),
            }),
        ]).describe('Which nodes to target'),
    }, async (params) => {
        try { return toolResult(await client.dropConnections(params)); } catch (e) { return toolError(e); }
    });
}
