/**
 * Каждый тул — правильный запрос: то, что реально уходит в панель, проходит схему контракта.
 *
 * Запуск: npm run check:requests
 *
 * Зачем, если есть check:contract. Тот сверяет ИМЕНА полей верхнего уровня и только у тулов,
 * которые отдают аргументы в клиент как есть. Мимо него прошли поломки уровнем ниже: в 3.x
 * `ip_control_drop_connections` слал `dropBy.by = 'userUuids'` (в контракте `userIds` с числами),
 * а `ip_control_fetch_ips` требовал UUID пользователя там, где путь ждёт числовой id. Тул
 * выглядит рабочим, панель отвечает `Validation failed` — и так до первого живого вызова.
 *
 * Как работает:
 *   1. тулы регистрируются в фейковый server, fetch подменён и записывает запросы;
 *   2. по JSON-схеме входа каждого тула строятся образцы аргументов: «всё заполнено» и
 *      «только обязательное», а для объединений — по варианту на каждую ветку;
 *   3. обработчик вызывается с образцом, каждый записанный запрос сопоставляется с командой
 *      контракта по «метод + путь», и тело с query прогоняются через её схемы.
 *
 * Образцы синтетические: строка, у которой тул не знает формата, получает нейтральное значение,
 * и контракт может отвергнуть его по длине или формату. Такие расхождения — повод сузить схему
 * тула, а не шум: модель тоже не знает формата, пока схема ей его не скажет.
 */
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import * as contract from '@remnawave/backend-contract';
import { RemnawaveClient } from '../src/client/index.js';
import { registerAllTools } from '../src/tools/index.js';

type Handler = (args: any) => Promise<any>;
const tools: { name: string; shape: Record<string, z.ZodTypeAny>; handler: Handler }[] = [];
const fakeServer: any = {
    tool: (name: string, ...rest: unknown[]) => {
        const handler = rest.at(-1) as Handler;
        const shape = (rest.find((arg) => arg && typeof arg === 'object' && Object.values(arg).every(
            (value) => value && typeof value === 'object' && ('_zod' in (value as object) || '_def' in (value as object)),
        )) ?? {}) as Record<string, z.ZodTypeAny>;
        tools.push({ name, shape, handler });
    },
};

// --- команды контракта: «метод + путь» → схемы --------------------------------
interface Command {
    name: string;
    pattern: RegExp;
    method: string;
    body?: any;
    query?: any;
    params?: any;
    response?: any;
}
const commands: Command[] = [];
for (const [name, value] of Object.entries(contract as Record<string, any>)) {
    const details = value?.endpointDetails;
    if (!details?.REQUEST_METHOD || typeof value.TSQ_url !== 'string') continue;
    const pattern = new RegExp(
        '^' + value.TSQ_url.replace(/\/+$/, '').replace(/:([A-Za-z_]\w*)/g, '(?<$1>[^/]+)') + '/?$',
    );
    commands.push({
        name,
        pattern,
        method: String(details.REQUEST_METHOD).toUpperCase(),
        body: value.RequestBodySchema,
        query: value.RequestQuerySchema,
        // В 3.4 схема пути зовётся RequestParamSchema (у четырёх команд — RequestParamsSchema).
        params: value.RequestParamSchema ?? value.RequestParamsSchema,
        response: value.ResponseSchema,
    });
}
// Статичный путь важнее шаблонного: `/api/hosts/tags` иначе совпал бы с `/api/hosts/:uuid`.
commands.sort((a, b) => (a.pattern.source.match(/\(\?</g)?.length ?? 0) - (b.pattern.source.match(/\(\?</g)?.length ?? 0));

function findCommands(method: string, path: string): Command[] {
    return commands.filter((command) => command.method === method && command.pattern.test(path));
}

// --- образцы аргументов по JSON-схеме тула ------------------------------------
const UUID = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b';

// Дата в будущем: контракт отвергает expireAt в прошлом.
const DATE_TIME = '2030-01-01T00:00:00.000Z';
const PATTERN_CANDIDATES = ['SAMPLE_TAG', 'socks5://proxy.example:1080', DATE_TIME, '2030-01-01', UUID, 'sample-value'];

function sampleString(schema: any, key: string): string {
    if (schema.enum) return schema.enum[0];
    if (schema.const !== undefined) return schema.const;
    if (schema.pattern) {
        const pattern = new RegExp(schema.pattern);
        const fit = PATTERN_CANDIDATES.find((candidate) => pattern.test(candidate));
        if (fit) return fit;
    }
    // Тулы с выгрузкой в файл (saveToPath, saveImageToPath) записали бы образец в cwd.
    if (/Path$/.test(key)) return join(tmpdir(), `mcp-request-validation-${key}`);
    if (/tag/i.test(key)) return 'SAMPLE_TAG';
    if (/email/i.test(key)) return 'user@example.com';
    if (/(telegram|user)Id$/i.test(key)) return '118';
    switch (schema.format) {
        case 'uuid': return UUID;
        case 'ipv4': return '203.0.113.7';
        case 'ipv6': return '2001:db8::7';
        case 'date-time': return DATE_TIME;
        case 'date': return '2030-01-01';
        case 'email': return 'user@example.com';
        case 'uri':
        case 'url': return 'https://example.com';
    }
    if (/date$|At$/i.test(key)) return DATE_TIME;
    if (/^(start|end)$/.test(key)) return '2030-01-01';
    if (/uuid$/i.test(key)) return UUID;
    if (/^(ip|address)$/i.test(key)) return '203.0.113.7';
    if (/base64|blinded/i.test(key)) return 'c2FtcGxl';
    if (/countryCode/.test(key)) return 'NL';
    if (/userId$/.test(key)) return '118';
    return 'sample-value';
}

/**
 * variant выбирает ветку у каждого объединения; full — заполнять ли необязательные поля.
 * nulls — передавать null везде, где схема тула его разрешает: так ловится «тул обещает
 * „null to clear“, а контракт null не принимает».
 */
let nulls = false;
/** Ответы панели с null везде, где схема ответа его допускает: read-merge-write тулы не должны
 *  возвращать такой null в тело (так падали subscription_settings_update и hosts_update). */
let responseNulls = false;
function sample(schema: any, key: string, variant: number, full: boolean): unknown {
    if (!schema || typeof schema !== 'object') return 'sample-value';
    const branches = schema.anyOf ?? schema.oneOf;
    if (nulls && (branches?.some((b: any) => b.type === 'null') || (Array.isArray(schema.type) && schema.type.includes('null')))) {
        return null;
    }
    if (branches) {
        const usable = branches.filter((branch: any) => branch.type !== 'null');
        return sample(usable[variant % usable.length] ?? usable[0], key, variant, full);
    }
    if (schema.const !== undefined) return schema.const;
    if (schema.enum) return schema.enum[variant % schema.enum.length];
    const type = Array.isArray(schema.type) ? schema.type.find((t: string) => t !== 'null') : schema.type;
    switch (type) {
        case 'string': return sampleString(schema, key);
        case 'number':
        case 'integer': return Math.max(schema.minimum ?? 1, Math.min(schema.maximum ?? 1, 1));
        case 'boolean': return false;
        case 'array': return [sample(schema.items, key.replace(/s$/, ''), variant, full)];
        case 'object': {
            const out: Record<string, unknown> = {};
            const required = new Set<string>(schema.required ?? []);
            for (const [prop, propSchema] of Object.entries(schema.properties ?? {})) {
                if (full || required.has(prop)) out[prop] = sample(propSchema, prop, variant, full);
            }
            return out;
        }
    }
    return 'sample-value';
}

function branchCount(schema: any): number {
    if (!schema || typeof schema !== 'object') return 1;
    let count = (schema.anyOf ?? schema.oneOf ?? []).filter((b: any) => b.type !== 'null').length || 1;
    if (schema.enum) count = Math.max(count, Math.min(schema.enum.length, 3));
    for (const child of [
        ...Object.values(schema.properties ?? {}),
        schema.items,
        ...(schema.anyOf ?? schema.oneOf ?? []),
    ]) {
        count = Math.max(count, branchCount(child));
    }
    return count;
}

// --- запуск -----------------------------------------------------------------
const requests: { method: string; path: string; query: Record<string, string>; body: any }[] = [];
// Обработчики с чтением перед правкой (hosts_update, node_plugins_update…) мёржат правку с
// текущим объектом — отвечаем образцом по схеме ответа той же команды, иначе мёржить не с чем.
globalThis.fetch = (async (url: any, opts: any) => {
    const target = new URL(String(url));
    const method = String(opts?.method ?? 'GET').toUpperCase();
    requests.push({
        method,
        path: target.pathname,
        query: Object.fromEntries(target.searchParams),
        body: opts?.body ? JSON.parse(opts.body) : undefined,
    });
    const responseSchema = findCommands(method, target.pathname)[0]?.response;
    let payload: unknown = { response: {} };
    if (responseSchema) {
        try {
            nulls = responseNulls;
            payload = sample(z.toJSONSchema(responseSchema, { io: 'output', unrepresentable: 'any' }), '', 0, true);
            nulls = false;
        } catch {
            // схема ответа не переводится в JSON Schema — обойдёмся пустым
        }
    }
    return new Response(JSON.stringify(payload), { status: 200 });
}) as any;

const client = new RemnawaveClient({ baseUrl: 'https://panel.test', apiToken: 'test' } as any);
registerAllTools(fakeServer, client, false);

// Какие тулы остаются в readonly-режиме: от остальных ждём хотя бы один не-GET запрос.
const readonlyNames = new Set<string>();
registerAllTools({ tool: (name: string) => readonlyNames.add(name) } as any, client, true);
/** Не-readonly тулы, которые по смыслу только читают (запись идёт в локальный файл). */
const READS_ONLY_BY_DESIGN = new Set<string>([]);

// subscription_templates_update_from_file читает тело шаблона из файла — кладём настоящий.
writeFileSync(join(tmpdir(), 'mcp-request-validation-filePath'), '{"outbounds": []}\n');

// query приходит строками: объекты и массивы — JSON'ом, числа — текстом. Возвращаем типы,
// иначе схема с z.number() отвергла бы корректный запрос.
function decodeQuery(query: Record<string, string>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(query)) {
        try { out[key] = JSON.parse(value); } catch { out[key] = value; }
    }
    return out;
}

function issues(schema: any, value: unknown, coerceQuery = false): string[] {
    if (!schema?.safeParse) return [];
    let parsed = schema.safeParse(value);
    // query-схемы контракта бывают на coerce, бывают на строках — пробуем обе формы
    if (!parsed.success && coerceQuery) {
        const raw = Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]));
        const second = schema.safeParse(raw);
        if (second.success) parsed = second;
    }
    if (parsed.success) return [];
    return parsed.error.issues.map((issue: any) =>
        `${issue.path.join('.') || '(корень)'}: ${issue.message}`,
    );
}

/**
 * Параметры пути. Схема пути есть не у каждой команды (у `ConnectionsByUserCommand` её нет),
 * поэтому сверх неё — правило по имени: `:userId` и `:id` в 3.x числовые, UUID туда не ляжет.
 * Ровно так `ip_control_fetch_ips` требовал UUID пользователя, которого в 3.x нет вовсе.
 */
function pathIssues(command: Command, path: string): string[] {
    const groups = command.pattern.exec(path)?.groups ?? {};
    const problems = issues(command.params, groups).map((p) => `путь ${p}`);
    for (const [name, value] of Object.entries(groups)) {
        if (/^(userId|id)$/.test(name) && !/^\d+$/.test(value)) {
            problems.push(`путь ${name}: ждёт числовой id, пришло «${value}»`);
        }
    }
    return problems;
}

/**
 * Ключи, которых в схеме контракта нет. zod по умолчанию молча отбрасывает лишнее, поэтому
 * safeParse такой запрос пропускает, а панель тихо игнорирует поле. Так в 3.4 умер
 * `excludedInternalSquads` у хостов (стал `internalSquads: {mode, squads}`): тул слал старое
 * поле, ответ был успешным, а правка не применялась.
 */
function unknownKeys(schema: any, value: unknown, path: string): string[] {
    if (!schema || typeof schema !== 'object' || value === null || typeof value !== 'object') return [];
    const branches = schema.anyOf ?? schema.oneOf;
    if (branches) {
        // Ветка `null` для непустого значения не в счёт: иначе она «проходила» бы всегда, и
        // лишние ключи внутри nullable-объектов не ловились бы вовсе.
        const usable = branches.filter((branch: any) => branch.type !== 'null');
        const results = usable.map((branch: any) => unknownKeys(branch, value, path));
        return results.find((r: string[]) => r.length === 0) ?? results[0] ?? [];
    }
    if (schema.allOf) return schema.allOf.flatMap((part: any) => unknownKeys(part, value, path));
    if (!schema.properties && schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, inner]) =>
            unknownKeys(schema.additionalProperties, inner, `${path}${key}.`),
        );
    }
    if (Array.isArray(value)) {
        return schema.items ? value.flatMap((item, i) => unknownKeys(schema.items, item, `${path}${i}.`)) : [];
    }
    if (!schema.properties) return [];
    const out: string[] = [];
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
        if (!(key in schema.properties)) {
            if (schema.additionalProperties === undefined || schema.additionalProperties === false) {
                out.push(`${path}${key}`);
            }
            continue;
        }
        out.push(...unknownKeys(schema.properties[key], inner, `${path}${key}.`));
    }
    return out;
}

const jsonCache = new Map<any, any>();
function toJson(schema: any): any {
    if (!schema) return null;
    if (!jsonCache.has(schema)) {
        try {
            jsonCache.set(schema, z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }));
        } catch {
            jsonCache.set(schema, null);
        }
    }
    return jsonCache.get(schema);
}

/**
 * Где синтетический образец заведомо не годится — с причиной. Игнорируются только проблемы
 * по указанным путям, остальное в тех же тулах проверяется как обычно.
 */
const SAMPLE_LIMITS: Record<string, { paths: string[]; why: string }> = {
    users_resolve: {
        paths: ['(корень)'],
        why: 'контракт требует ровно один ключ, образец «все поля» передаёт три',
    },
    system_srr_matcher: {
        paths: ['responseRules.'],
        why: 'правила SRR — свободная структура, образец по record() её не построит',
    },
    subscription_settings_update: {
        paths: ['responseRules.'],
        why: 'правила SRR — свободная структура, образец по record() её не построит',
    },
};

function limited(tool: string, problem: string): boolean {
    const limit = SAMPLE_LIMITS[tool];
    if (!limit) return false;
    const path = problem.replace(/^(тело|query|путь) /, '').split(':')[0];
    // `x.` глушит только вложенное: сам `x: null` или `x: expected object` останутся провалом.
    return limit.paths.some((prefix) => prefix.endsWith('.') ? path.startsWith(prefix) : path === prefix);
}

const failures: string[] = [];
const unmatched: string[] = [];
let checkedRequests = 0;
const silent: string[] = [];

for (const tool of tools) {
    const json = z.toJSONSchema(z.object(tool.shape), { io: 'input', unrepresentable: 'any' }) as any;
    const variants = branchCount(json);
    const seen = new Set<string>();
    let sentAnything = false;

    const passes = [[true, false, false], [false, false, false], [true, true, false], [false, false, true]] as const;
    let wrote = false;
    for (const [full, withNulls, nullResponses] of passes) {
        responseNulls = nullResponses;
        for (let variant = 0; variant < variants; variant++) {
            nulls = withNulls;
            const args = sample(json, '', variant, full) as Record<string, unknown>;
            nulls = false; // ответы панели на чтение строятся без null
            requests.length = 0;
            try {
                await tool.handler(args);
            } catch {
                // обработчик может упасть на синтетическом ответе — запросы до падения уже записаны
            }
            for (const request of requests) {
                sentAnything = true;
                if (request.method !== 'GET') wrote = true;
                const candidates = findCommands(request.method, request.path);
                if (!candidates.length) {
                    unmatched.push(`  ${tool.name}: ${request.method} ${request.path}`);
                    continue;
                }
                checkedRequests++;
                // На одном «метод + путь» может висеть несколько команд — годится любая.
                const results: { command: Command; problems: string[] }[] = candidates.map((command) => ({
                    command,
                    problems: [
                        ...pathIssues(command, request.path),
                        ...issues(command.body ?? (request.body !== undefined ? null : null), request.body ?? {}).map((p) => `тело ${p}`),
                        ...issues(command.query, decodeQuery(request.query), true).map((p) => `query ${p}`),
                        ...(request.body && command.body
                            ? unknownKeys(toJson(command.body), request.body, '').map((key) => `тело ${key}: поля нет в контракте, панель его отбросит`)
                            : []),
                        ...(request.body !== undefined && !command.body
                            ? ['тело: у команды нет тела по контракту, а запрос его шлёт']
                            : []),
                        ...Object.keys(request.query)
                            .filter((key) => !command.query || !(key in (toJson(command.query)?.properties ?? {})))
                            .map((key) => `query ${key}: параметра нет в контракте`),
                    ],
                }));
                for (const result of results) {
                    result.problems = result.problems.filter((problem) => !limited(tool.name, problem));
                }
                if (results.some((result) => result.problems.length === 0)) continue;
                const best = results[0];
                const line =
                    `  ✗ ${tool.name} → ${best.command.name} (${nullResponses ? 'панель отвечает null' : withNulls ? 'null где можно' : full ? 'все поля' : 'только обязательные'}` +
                    `${variants > 1 ? `, вариант ${variant + 1}` : ''}): ${best.problems.slice(0, 4).join('; ')}`;
                const dedupe = best.problems.join('|');
                if (!seen.has(dedupe)) {
                    seen.add(dedupe);
                    failures.push(line);
                }
            }
        }
    }
    responseNulls = false;
    if (!sentAnything) silent.push(tool.name);
    // Мутирующий тул, ни разу не дошедший до изменяющего запроса, не проверен вовсе: обработчик
    // падал раньше (так subscription_templates_update_from_file слал только GET).
    else if (!readonlyNames.has(tool.name) && !wrote && !READS_ONLY_BY_DESIGN.has(tool.name)) {
        failures.push(`  ✗ ${tool.name}: мутирующий тул не отправил ни одного изменяющего запроса — его запись не проверена`);
    }
}

console.log(`Тулов: ${tools.length}, проверено запросов: ${checkedRequests}\n`);
if (silent.length) {
    console.log(`Без запроса к панели (${silent.length}): ${silent.join(', ')}\n`);
}
if (unmatched.length) {
    console.log(`ЗАПРОСЫ ВНЕ КОНТРАКТА (${unmatched.length}):`);
    for (const line of [...new Set(unmatched)]) console.log(line);
    console.log();
}
if (failures.length) {
    console.log(`ЗАПРОС НЕ ПРОХОДИТ СХЕМУ КОНТРАКТА (${failures.length}):`);
    for (const line of failures) console.log(line);
    process.exit(1);
}
console.log('Все запросы тулов проходят схемы контракта.');
