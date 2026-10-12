/**
 * Таблицы инструментов в README — из самого сервера, а не руками.
 *
 * Запуск: npm run docs:tools (переписывает README.md), npm run docs:tools -- --check (только
 * сверяет и падает, если README отстал).
 *
 * Зачем. Ручные таблицы отстали на десятки тулов и врали о мёртвых именах
 * (`users_get_by_subscription_uuid` удалён в 3.x, а в README жил). Здесь источник один:
 * регистрация тулов. Группа — файл регистрации, режим — тот же признак, что у readonly-режима
 * (тул зарегистрирован и при REMNAWAVE_READONLY=true).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RemnawaveClient } from '../src/client/index.js';
import { registerUserTools } from '../src/tools/users.js';
import { registerNodeTools } from '../src/tools/nodes.js';
import { registerHostTools } from '../src/tools/hosts.js';
import { registerSystemTools } from '../src/tools/system.js';
import { registerSubscriptionTools } from '../src/tools/subscriptions.js';
import { registerInboundTools } from '../src/tools/inbounds.js';
import { registerSquadTools } from '../src/tools/squads.js';
import { registerHwidTools } from '../src/tools/hwid.js';
import { registerApiTokenTools } from '../src/tools/api-tokens.js';
import { registerKeygenTools } from '../src/tools/keygen.js';
import { registerInfraBillingTools } from '../src/tools/infra-billing.js';
import { registerSnippetTools } from '../src/tools/snippets.js';
import { registerExternalSquadTools } from '../src/tools/external-squads.js';
import { registerSettingsTools } from '../src/tools/settings.js';
import { registerSubPageConfigTools } from '../src/tools/subscription-page-configs.js';
import { registerSubscriptionTemplateTools } from '../src/tools/subscription-templates.js';
import { registerNodePluginTools } from '../src/tools/node-plugins.js';
import { registerIpControlTools } from '../src/tools/ip-control.js';
import { registerMetadataTools } from '../src/tools/metadata.js';
import { registerBandwidthStatsTools } from '../src/tools/bandwidth-stats.js';
import { registerNodeIntegrationTools } from '../src/tools/node-integrations.js';

type Register = (server: any, client: RemnawaveClient, readonly: boolean) => void;

const GROUPS: { file: string; en: string; ru: string; register: Register }[] = [
    { file: 'users.ts', en: 'Users', ru: 'Пользователи', register: registerUserTools },
    { file: 'nodes.ts', en: 'Nodes', ru: 'Ноды', register: registerNodeTools },
    { file: 'hosts.ts', en: 'Hosts', ru: 'Хосты', register: registerHostTools },
    { file: 'system.ts', en: 'System', ru: 'Система', register: registerSystemTools as Register },
    { file: 'subscriptions.ts', en: 'Subscriptions', ru: 'Подписки', register: registerSubscriptionTools as Register },
    { file: 'inbounds.ts', en: 'Config Profiles & Inbounds', ru: 'Конфиг-профили и Inbounds', register: registerInboundTools },
    { file: 'squads.ts', en: 'Internal Squads', ru: 'Внутренние группы', register: registerSquadTools },
    { file: 'hwid.ts', en: 'HWID Devices', ru: 'HWID-устройства', register: registerHwidTools },
    { file: 'api-tokens.ts', en: 'API Tokens', ru: 'API-токены', register: registerApiTokenTools },
    { file: 'keygen.ts', en: 'Keygen', ru: 'Keygen', register: registerKeygenTools as Register },
    { file: 'infra-billing.ts', en: 'Infra Billing', ru: 'Биллинг инфраструктуры', register: registerInfraBillingTools },
    { file: 'snippets.ts', en: 'Snippets', ru: 'Сниппеты', register: registerSnippetTools },
    { file: 'external-squads.ts', en: 'External Squads', ru: 'Внешние группы', register: registerExternalSquadTools },
    { file: 'settings.ts', en: 'Settings', ru: 'Настройки', register: registerSettingsTools },
    { file: 'subscription-page-configs.ts', en: 'Subscription Page Configs', ru: 'Страницы подписок', register: registerSubPageConfigTools },
    { file: 'subscription-templates.ts', en: 'Subscription Templates', ru: 'Шаблоны подписок', register: registerSubscriptionTemplateTools },
    { file: 'node-plugins.ts', en: 'Node Plugins & Shared Lists', ru: 'Плагины нод и общие списки', register: registerNodePluginTools },
    { file: 'node-integrations.ts', en: 'Node Integrations', ru: 'Интеграции нод', register: registerNodeIntegrationTools },
    { file: 'ip-control.ts', en: 'IP Control & Geocheck', ru: 'IP-контроль и геопроверка', register: registerIpControlTools },
    { file: 'metadata.ts', en: 'Metadata', ru: 'Метаданные', register: registerMetadataTools },
    { file: 'bandwidth-stats.ts', en: 'Bandwidth Stats', ru: 'Статистика трафика', register: registerBandwidthStatsTools as Register },
];

// Группа, зарегистрированная в src/tools/index.ts, но забытая здесь, молча выпала бы из таблиц
// и счётчиков при зелёном --check. Сверяем списки по именам функций регистрации.
const indexSource = readFileSync(join(process.cwd(), 'src', 'tools', 'index.ts'), 'utf8');
const registered = new Set([...indexSource.matchAll(/^\s+(register\w+Tools)\(/gm)].map((m) => m[1]));
const listed = new Set(GROUPS.map((group) => group.register.name));
const forgotten = [...registered].filter((name) => !listed.has(name));
if (forgotten.length) {
    console.log(`В GROUPS нет групп из src/tools/index.ts: ${forgotten.join(', ')}`);
    process.exit(1);
}

const client = new RemnawaveClient({ baseUrl: 'https://panel.test', apiToken: 'x' } as any);

function collect(register: Register, readonly: boolean) {
    const tools: { name: string; description: string }[] = [];
    register({ tool: (name: string, description: string) => tools.push({ name, description }) }, client, readonly);
    return tools;
}

const groups = GROUPS.map((group) => {
    const all = collect(group.register, false);
    const readNames = new Set(collect(group.register, true).map((tool) => tool.name));
    return { ...group, all, readNames };
});
const total = groups.reduce((sum, group) => sum + group.all.length, 0);
const totalRead = groups.reduce((sum, group) => sum + group.readNames.size, 0);

const plural = (n: number) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'инструмент';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'инструмента';
    return 'инструментов';
};
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function toolTables(lang: 'en' | 'ru'): string {
    return groups
        .map((group) => {
            const title = lang === 'en'
                ? `#### ${group.en} (${group.all.length} tool${group.all.length === 1 ? '' : 's'})`
                : `#### ${group.ru} (${group.all.length} ${plural(group.all.length)})`;
            const head = lang === 'en'
                ? '| Tool | Description | Mode |\n|------|-------------|------|'
                : '| Инструмент | Описание | Режим |\n|------------|----------|-------|';
            const rows = group.all.map((tool) =>
                `| \`${tool.name}\` | ${cell(tool.description)} | ${group.readNames.has(tool.name) ? 'read' : 'write'} |`,
            );
            return [title, '', head, ...rows].join('\n');
        })
        .join('\n\n');
}

function readonlyTable(lang: 'en' | 'ru'): string {
    const head = lang === 'en'
        ? `In readonly mode, the available tools are reduced from ${total} to ${totalRead}:\n\n| Category | Available tools |\n|----------|----------------|`
        : `В readonly-режиме количество доступных инструментов сокращается с ${total} до ${totalRead}:\n\n| Категория | Доступные инструменты |\n|-----------|----------------------|`;
    const rows = groups
        .filter((group) => group.readNames.size > 0)
        .map((group) =>
            `| ${lang === 'en' ? group.en : group.ru} (${group.readNames.size}) | ${[...group.readNames].map((name) => `\`${name}\``).join(', ')} |`,
        );
    return [head, ...rows].join('\n');
}

/**
 * Счётчики в «Структуре проекта». Блок — код, маркеры-комментарии в нём отрисовались бы
 * текстом, поэтому строки файлов меняются по месту: `│   ├── users.ts   # …`.
 */
function structure(text: string, lang: 'en' | 'ru'): string {
    const heading = lang === 'en' ? '### Project Structure' : '### Структура проекта';
    const from = text.indexOf(heading);
    const to = text.indexOf('```', text.indexOf('```', from) + 3);
    if (from === -1 || to === -1) throw new Error(`README: нет раздела ${heading}`);
    let block = text.slice(from, to);
    for (const group of groups) {
        const count = lang === 'en'
            ? `${group.all.length} tool${group.all.length === 1 ? '' : 's'}`
            : `${group.all.length} ${plural(group.all.length)}`;
        const pattern = new RegExp(`^(│   [├└]── ${group.file.replace('.', '\\.')}\\s*)#.*$`, 'm');
        if (!pattern.test(block)) throw new Error(`README: в структуре нет ${group.file}`);
        block = block.replace(pattern, (_m, left: string) =>
            `${left.trimEnd().padEnd(34)} # ${lang === 'en' ? group.en : group.ru} (${count})`,
        );
    }
    return text.slice(0, from) + block + text.slice(to);
}

/** Заменить содержимое между маркерами; маркеров нет — значит, README не размечен, это ошибка. */
function replaceBetween(text: string, marker: string, content: string): string {
    const begin = `<!-- generated:${marker} -->`;
    const end = `<!-- /generated:${marker} -->`;
    const from = text.indexOf(begin);
    const to = text.indexOf(end);
    if (from === -1 || to === -1) throw new Error(`README: нет маркеров ${marker}`);
    return text.slice(0, from + begin.length) + '\n' + content + '\n' + text.slice(to);
}

const path = join(process.cwd(), 'README.md');
const before = readFileSync(path, 'utf8');
let after = before;
for (const lang of ['en', 'ru'] as const) {
    after = replaceBetween(after, `tools-${lang}`, toolTables(lang));
    after = replaceBetween(after, `readonly-${lang}`, readonlyTable(lang));
    after = structure(after, lang);
    after = replaceBetween(
        after,
        `count-${lang}`,
        lang === 'en'
            ? `- **${total} tools** — users, nodes, hosts, subscriptions, squads, HWID, config profiles, inbounds, API tokens, billing, snippets, external squads, settings, subscription page configs and templates, node plugins and shared lists, node integrations, IP control and geocheck, metadata, bandwidth stats\n- **Readonly mode** — restrict to ${totalRead} read-only tools for safe monitoring`
            : `- **${total} ${plural(total)}** — пользователи, ноды, хосты, подписки, группы, HWID, конфиг-профили, inbounds, API-токены, биллинг, сниппеты, внешние группы, настройки, страницы и шаблоны подписок, плагины нод и общие списки, интеграции нод, IP-контроль и геопроверка, метаданные, статистика трафика\n- **Readonly-режим** — ограничение до ${totalRead} ${plural(totalRead)} только для чтения`,
    );
}

if (process.argv.includes('--check')) {
    if (after !== before) {
        console.log('README отстал от регистрации тулов — запусти npm run docs:tools');
        process.exit(1);
    }
    console.log(`README совпадает с регистрацией: ${total} тулов, ${totalRead} в readonly.`);
} else {
    writeFileSync(path, after);
    console.log(`README обновлён: ${total} тулов, ${totalRead} в readonly.`);
}
