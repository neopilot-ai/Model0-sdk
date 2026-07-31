import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	fetchWithRetry,
	formatApiError,
	convertToolMode,
	convertToolsToV0Format,
	convertMessages,
	extractTextFromMessage,
	parseV0Response
} from './utils';

describe('formatApiError', () => {
	it('returns friendly message for 401', () => {
		expect(formatApiError(401, 'unauthorized')).toContain('401');
		expect(formatApiError(401, 'unauthorized')).toContain('API key');
	});

	it('returns friendly message for 429', () => {
		expect(formatApiError(429, 'too many')).toContain('429');
		expect(formatApiError(429, 'too many')).toContain('Rate limited');
	});

	it('returns friendly message for 500', () => {
		expect(formatApiError(500, 'error')).toContain('server error');
	});

	it('returns friendly message for 502', () => {
		expect(formatApiError(502, 'bad gateway')).toContain('server error');
	});

	it('returns friendly message for 503', () => {
		expect(formatApiError(503, 'unavailable')).toContain('server error');
	});

	it('returns generic message for other status codes', () => {
		const result = formatApiError(418, "I'm a teapot");
		expect(result).toContain('418');
		expect(result).toContain("I'm a teapot");
	});
});

describe('convertToolMode', () => {
	it('converts 0 (Auto) to "auto"', () => {
		expect(convertToolMode(0)).toBe('auto');
	});

	it('converts 1 (Required) to "required"', () => {
		expect(convertToolMode(1)).toBe('required');
	});

	it('defaults unknown values to "auto"', () => {
		expect(convertToolMode(99)).toBe('auto');
	});
});

describe('convertToolsToV0Format', () => {
	it('converts a tool with name, description, and schema', () => {
		const result = convertToolsToV0Format([
			{
				name: 'get_weather',
				description: 'Get weather for a city',
				inputSchema: {
					type: 'object',
					properties: { city: { type: 'string' } }
				}
			}
		]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('function');
		expect(result[0].function?.name).toBe('get_weather');
		expect(result[0].function?.description).toBe('Get weather for a city');
		expect(result[0].function?.parameters).toEqual({
			type: 'object',
			properties: { city: { type: 'string' } }
		});
	});

	it('handles missing description', () => {
		const result = convertToolsToV0Format([{ name: 'no_desc' }]);

		expect(result[0].function?.description).toBeUndefined();
	});

	it('uses empty object for missing inputSchema', () => {
		const result = convertToolsToV0Format([{ name: 'no_schema' }]);

		expect(result[0].function?.parameters).toEqual({});
	});

	it('returns empty array for empty input', () => {
		expect(convertToolsToV0Format([])).toEqual([]);
	});
});

describe('convertMessages', () => {
	it('converts a user text message', () => {
		const result = convertMessages([
			{
				role: 1,
				content: [{ value: 'Hello' }]
			}
		]);

		expect(result).toHaveLength(1);
		expect(result[0].role).toBe('user');
		expect(result[0].content).toBe('Hello');
	});

	it('converts an assistant text message', () => {
		const result = convertMessages([
			{
				role: 2,
				content: [{ value: 'Hi there' }]
			}
		]);

		expect(result[0].role).toBe('assistant');
		expect(result[0].content).toBe('Hi there');
	});

	it('concatenates multiple text parts', () => {
		const result = convertMessages([
			{
				role: 1,
				content: [{ value: 'Hello' }, { value: ' ' }, { value: 'World' }]
			}
		]);

		expect(result[0].content).toBe('Hello World');
	});

	it('extracts tool call parts', () => {
		const result = convertMessages([
			{
				role: 2,
				content: [
					{ value: 'Let me check' },
					{
						callId: 'call_1',
						name: 'get_weather',
						input: { city: 'London' }
					}
				]
			}
		]);

		expect(result[0].content).toBe('Let me check');
		expect(result[0].tool_calls).toHaveLength(1);
		expect(result[0].tool_calls![0].id).toBe('call_1');
		expect(result[0].tool_calls![0].function.name).toBe('get_weather');
		expect(result[0].tool_calls![0].function.arguments).toBe(
			JSON.stringify({ city: 'London' })
		);
	});

	it('extracts tool result parts and sets tool_call_id', () => {
		const result = convertMessages([
			{
				role: 1,
				content: [
					{
						callId: 'call_1',
						content: [{ value: 'Sunny, 22°C' }]
					}
				]
			}
		]);

		expect(result[0].tool_call_id).toBe('call_1');
		expect(result[0].content).toBe('Sunny, 22°C');
	});

	it('handles messages with no text parts', () => {
		const result = convertMessages([
			{
				role: 1,
				content: []
			}
		]);

		expect(result[0].content).toBe('');
	});

	it('handles unknown parts gracefully', () => {
		const result = convertMessages([
			{
				role: 1,
				content: [{ value: 'Hello' }, { unknownProp: 'ignored' }]
			}
		]);

		expect(result[0].content).toBe('Hello');
	});
});

describe('extractTextFromMessage', () => {
	it('extracts text from text parts', () => {
		const result = extractTextFromMessage({
			role: 1,
			content: [{ value: 'Hello' }, { value: ' ' }, { value: 'World' }]
		});

		expect(result).toBe('Hello World');
	});

	it('returns empty string for no text parts', () => {
		const result = extractTextFromMessage({
			role: 1,
			content: [{ callId: 'c1', name: 'tool', input: {} }]
		});

		expect(result).toBe('');
	});

	it('returns empty string for empty content', () => {
		const result = extractTextFromMessage({
			role: 1,
			content: []
		});

		expect(result).toBe('');
	});

	it('ignores non-text parts', () => {
		const result = extractTextFromMessage({
			role: 1,
			content: [
				{ value: 'A' },
				{ callId: 'c1', name: 't', input: {} },
				{ value: 'B' }
			]
		});

		expect(result).toBe('AB');
	});
});

describe('parseV0Response', () => {
	it('returns a text part for string content', () => {
		const result = parseV0Response({
			content: 'Hello world'
		});

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('text');
		expect(result[0].text).toBe('Hello world');
	});

	it('returns tool call parts', () => {
		const result = parseV0Response({
			content: '',
			tool_calls: [
				{
					id: 'tc_1',
					type: 'function',
					function: { name: 'get_weather', arguments: '{"city":"Paris"}' }
				}
			]
		});

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('tool_call');
		expect(result[0].toolCallId).toBe('tc_1');
		expect(result[0].toolName).toBe('get_weather');
		expect(result[0].toolInput).toEqual({ city: 'Paris' });
	});

	it('returns both text and tool calls when present', () => {
		const result = parseV0Response({
			content: 'Here is the weather:',
			tool_calls: [
				{
					id: 'tc_1',
					type: 'function',
					function: { name: 'get_weather', arguments: '{"city":"Tokyo"}' }
				}
			]
		});

		expect(result).toHaveLength(2);
		expect(result[0].type).toBe('text');
		expect(result[1].type).toBe('tool_call');
	});

	it('handles malformed JSON arguments gracefully', () => {
		const result = parseV0Response({
			content: '',
			tool_calls: [
				{
					id: 'tc_1',
					type: 'function',
					function: { name: 'bad_tool', arguments: '{invalid json}' }
				}
			]
		});

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('tool_call');
		expect(result[0].toolInput).toEqual({
			arguments: '{invalid json}'
		});
	});

	it("skips tool calls that aren't function type", () => {
		const result = parseV0Response({
			content: 'hi',
			tool_calls: [
				{
					id: 'tc_1',
					type: 'function',
					function: { name: 'valid', arguments: '{}' }
				}
			]
		});

		expect(result).toHaveLength(2);
	});

	it('returns empty array for empty content and no tool calls', () => {
		const result = parseV0Response({ content: '' });
		expect(result).toEqual([]);
	});
});

describe('fetchWithRetry', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	function okResponse(body?: string): Response {
		return new Response(body ?? '{"choices":[]}', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	function errorResponse(status: number): Response {
		return new Response('error', { status });
	}

	it('returns response on first success', async () => {
		const mockFetch = vi.fn().mockResolvedValue(okResponse());
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry('https://api.example.com', {});
		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('does not retry on 401 (non-retryable)', async () => {
		const mockFetch = vi.fn().mockResolvedValue(errorResponse(401));
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{ baseDelayMs: 1 }
		);
		expect(result.status).toBe(401);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('retries on 429 (rate limit) then succeeds', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(errorResponse(429))
			.mockResolvedValueOnce(okResponse());
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{ baseDelayMs: 1 }
		);
		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('retries on 500 (server error) then succeeds', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(errorResponse(500))
			.mockResolvedValueOnce(okResponse());
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{ baseDelayMs: 1 }
		);
		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('exhausts retries on persistent 429', async () => {
		const mockFetch = vi.fn().mockResolvedValue(errorResponse(429));
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{ baseDelayMs: 1 }
		);
		expect(result.status).toBe(429);
		expect(mockFetch).toHaveBeenCalledTimes(3);
	});

	it('retries on network error then succeeds', async () => {
		const mockFetch = vi
			.fn()
			.mockRejectedValueOnce(new TypeError('Network failure'))
			.mockResolvedValueOnce(okResponse());
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{ baseDelayMs: 1 }
		);
		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('re-throws abort errors without retrying', async () => {
		const abortError = new DOMException(
			'The operation was aborted',
			'AbortError'
		);
		const mockFetch = vi.fn().mockRejectedValue(abortError);
		vi.stubGlobal('fetch', mockFetch);

		await expect(
			fetchWithRetry('https://api.example.com', {}, { baseDelayMs: 1 })
		).rejects.toThrow('The operation was aborted');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('respects maxRetries: 1', async () => {
		const mockFetch = vi.fn().mockResolvedValue(errorResponse(500));
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchWithRetry(
			'https://api.example.com',
			{},
			{
				maxRetries: 1,
				baseDelayMs: 1
			}
		);
		expect(result.status).toBe(500);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('respects maxRetries: 0 (no retry)', async () => {
		const mockFetch = vi.fn().mockResolvedValue(errorResponse(500));
		vi.stubGlobal('fetch', mockFetch);

		await fetchWithRetry(
			'https://api.example.com',
			{},
			{
				maxRetries: 0,
				baseDelayMs: 1
			}
		);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});
