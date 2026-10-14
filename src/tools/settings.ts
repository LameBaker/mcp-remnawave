import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSettingsTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool('settings_get', 'Get Remnawave panel settings', {}, async () => {
        try { return toolResult(await client.getSettings()); } catch (e) { return toolError(e); }
    });

    server.tool(
        'subscription_settings_get',
        'Get subscription settings: custom response headers, custom remarks, SRR response rules, HWID settings',
        {},
        async () => {
            try { return toolResult(await client.getSubscriptionSettings()); } catch (e) { return toolError(e); }
        },
    );

    if (readonly) return;

    // Разделы настроек панели: passkeySettings, oauth2Settings (github, pocketid, yandex,
    // keycloak, generic, telegram), passwordSettings, brandingSettings. Каждый раздел контракт
    // принимает ЦЕЛИКОМ, со всеми полями — поэтому переданный кусок накладывается на текущее
    // значение раздела (на два уровня: раздел → провайдер OAuth2), а не уходит голым.
    server.tool(
        'settings_update',
        'Update Remnawave panel settings: passkeySettings, oauth2Settings, passwordSettings, brandingSettings. Pass only what changes — it is merged into the current section. DANGER: auth sections can lock admins out of the panel',
        {
            settings: z
                .record(z.string(), z.unknown())
                .describe('Sections to change, e.g. {"brandingSettings":{"title":"VPN"}} or {"oauth2Settings":{"github":{"enabled":false}}}'),
        },
        async ({ settings }) => {
            try {
                const current = (await client.getSettings()) as { response?: Record<string, unknown> };
                const base = current?.response ?? {};
                const isObject = (v: unknown): v is Record<string, unknown> =>
                    !!v && typeof v === 'object' && !Array.isArray(v);
                const body: Record<string, unknown> = {};
                for (const [section, value] of Object.entries(settings)) {
                    const was = base[section];
                    if (!isObject(value) || !isObject(was)) {
                        body[section] = value;
                        continue;
                    }
                    const merged: Record<string, unknown> = { ...was };
                    for (const [key, inner] of Object.entries(value)) {
                        merged[key] = isObject(inner) && isObject(was[key]) ? { ...was[key], ...inner } : inner;
                    }
                    body[section] = merged;
                }
                return toolResult(await client.updateSettings(body));
            } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'subscription_settings_update',
        'Update subscription settings. Only the fields you pass change; everything else is preserved',
        {
            serveJsonAtBaseSubscription: z.boolean().optional().describe('Serve JSON at base subscription URL'),
            isShowCustomRemarks: z.boolean().optional().describe('Show custom remarks'),
            customRemarks: z
                .object({
                    expiredUsers: z.array(z.string()).min(1).optional(),
                    limitedUsers: z.array(z.string()).min(1).optional(),
                    disabledUsers: z.array(z.string()).min(1).optional(),
                    emptyHosts: z.array(z.string()).min(1).optional(),
                    HWIDMaxDevicesExceeded: z.array(z.string()).min(1).optional(),
                    HWIDNotSupported: z.array(z.string()).min(1).optional(),
                })
                .optional()
                .describe('Custom remarks shown instead of hosts; pass only the lists that change, the rest are kept'),
            customResponseHeaders: z
                .record(z.string(), z.string().nullable())
                .optional()
                .describe(
                    'Custom response headers sent to clients (announce, profile-*, flclashx-*). Merged into the current ' +
                        'headers: pass only the headers that change, the rest are kept; a null value removes that header',
                ),
            randomizeHosts: z.boolean().optional().describe('Randomize host order in subscription'),
            responseRules: z
                .record(z.string(), z.unknown())
                .optional()
                .describe('SRR rules: which client user-agent gets which template. Replaces the whole config — pass it in full'),
            hwidSettings: z
                .record(z.string(), z.unknown())
                .optional()
                .describe('HWID policy settings; pass only the fields that change, the rest are kept'),
        },
        async (params) => {
            try {
                // PATCH затирает всё, чего нет в теле: частичный запрос снёс бы
                // правила SRR и заголовки клиентов. Читаем текущие настройки и
                // накладываем переданные поля поверх.
                const current = (await client.getSubscriptionSettings()) as {
                    response?: Record<string, unknown>;
                };
                const settings = current?.response;
                if (!settings) {
                    throw new Error('Subscription settings not found, refusing to update blindly');
                }

                // createdAt/updatedAt возвращаются панелью, но телом не принимаются.
                const { createdAt: _createdAt, updatedAt: _updatedAt, ...merged } = settings;
                // В ответе customResponseHeaders/responseRules/hwidSettings бывают null, а тело
                // null не принимает: непереданное поле с null уронило бы всю правку в 400.
                const body: Record<string, unknown> = Object.fromEntries(
                    Object.entries(merged).filter(([, value]) => value !== null),
                );
                for (const [key, value] of Object.entries(params)) {
                    if (value === undefined) continue;
                    // customRemarks и hwidSettings контракт принимает только целиком — частичную
                    // правку накладываем на текущее значение, иначе панель отклонит тело.
                    // customResponseHeaders — тоже поверх текущих: один переданный заголовок не
                    // должен стирать profile-update-interval, flclashx-* и announce. responseRules
                    // не сливаем: правила SRR — упорядоченный массив rules, слияние по ключам
                    // верхнего уровня всё равно заменило бы его целиком, а «дописать правило»
                    // без порядка опасно. Агент передаёт конфиг полностью, как его вернул get.
                    const was = body[key];
                    body[key] =
                        (key === 'customRemarks' || key === 'hwidSettings' || key === 'customResponseHeaders') &&
                        was && typeof was === 'object' && value && typeof value === 'object'
                            ? { ...(was as object), ...(value as object) }
                            : value;
                }
                // null у заголовка значит «удалить»: значений null контракт не принимает, ключ убираем.
                if (body.customResponseHeaders && typeof body.customResponseHeaders === 'object') {
                    body.customResponseHeaders = Object.fromEntries(
                        Object.entries(body.customResponseHeaders as Record<string, unknown>).filter(
                            ([, value]) => value !== null,
                        ),
                    );
                }

                return toolResult(await client.updateSubscriptionSettings(body));
            } catch (e) { return toolError(e); }
        },
    );
}
