import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

/**
 * Интеграции нод (3.4): именованный конфиг, который подключается к нодам через
 * `integrationUuids` (nodes_update, nodes_bulk_update). Содержимое `config` панель не
 * типизирует — это произвольный объект, его смысл задаёт сама интеграция.
 * ⚠️ В `config` могут лежать ключи внешних сервисов: вывод проходит вычистку секретов
 * (annotate.ts), но только по известным именам ключей.
 */
export function registerNodeIntegrationTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool('node_integrations_list', 'List node integrations', {}, async () => {
        try { return toolResult(await client.getNodeIntegrations()); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_get', 'Get a node integration by UUID', {
        uuid: z.string().uuid().describe('Integration UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getNodeIntegration(uuid)); } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    server.tool('node_integrations_create', 'Create a node integration; attach it to nodes via integrationUuids in nodes_update', {
        name: z.string().min(2).max(30).describe('Integration name, 2-30 chars'),
        description: z.string().max(255).nullish().describe('Description, up to 255 chars'),
        config: z.record(z.string(), z.unknown()).describe('Integration config object'),
    }, async (params) => {
        try { return toolResult(await client.createNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_update', 'Update a node integration. Only the passed fields change', {
        uuid: z.string().uuid().describe('Integration UUID'),
        name: z.string().min(2).max(30).optional().describe('New name'),
        description: z.string().max(255).nullish().describe('New description, null to clear'),
        config: z.record(z.string(), z.unknown()).optional().describe('New config object — REPLACES the current one'),
        restartNodes: z.boolean().optional().describe('Restart the nodes using this integration so the change applies now'),
    }, async (params) => {
        try { return toolResult(await client.updateNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_delete', 'Delete a node integration', {
        uuid: z.string().uuid().describe('Integration UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteNodeIntegration(uuid); return toolResult({ success: true, message: `Integration ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
