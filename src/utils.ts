export interface V0ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	tool_calls?: V0ToolCall[];
	tool_call_id?: string;
}

export interface V0Tool {
	type: string;
	function?: {
		name: string;
		description?: string;
		parameters?: object;
	};
}

export interface V0ChatRequest {
	model: string;
	messages: V0ChatMessage[];
	stream?: boolean;
	max_completion_tokens?: number;
	tools?: V0Tool[];
	tool_choice?: string | object;
}

export interface V0ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

export interface V0ChatResponse {
	choices: Array<{
		message: {
			content: string;
			tool_calls?: V0ToolCall[];
		};
		delta?: {
			content?: string;
		};
	}>;
}

export interface ResponsePart {
	type: 'text' | 'tool_call';
	text?: string;
	toolCallId?: string;
	toolName?: string;
	toolInput?: unknown;
}

export interface ChatToolInput {
	name: string;
	description?: string;
	inputSchema?: object;
}

export interface ChatMessageInput {
	role: number;
	content: Array<Record<string, unknown>>;
}

export interface RetryOptions {
	maxRetries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
}

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: 2,
	baseDelayMs: 1000,
	maxDelayMs: 8000
};

function isRetryableError(status: number | undefined): boolean {
	if (status === undefined) {
		return true;
	}
	return status === 429 || (status >= 500 && status < 600);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
	url: string,
	options: RequestInit,
	retryOptions?: RetryOptions
): Promise<Response> {
	const { maxRetries, baseDelayMs, maxDelayMs } = {
		...DEFAULT_RETRY_OPTIONS,
		...retryOptions
	};

	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);

			if (response.ok) {
				return response;
			}

			if (!isRetryableError(response.status) || attempt === maxRetries) {
				return response;
			}

			lastError = new Error(`HTTP ${response.status}`);
			const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
			const jitter = Math.random() * 500;
			await sleep(delay + jitter);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				throw err;
			}

			if (attempt === maxRetries) {
				throw err;
			}

			lastError = err instanceof Error ? err : new Error(String(err));
			const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
			const jitter = Math.random() * 500;
			await sleep(delay + jitter);
		}
	}

	throw lastError ?? new Error('fetchWithRetry failed');
}

export function formatApiError(status: number, body: string): string {
	switch (status) {
		case 401:
			return 'Invalid model0 API key (401). Please update your key via the "Manage model0 API Key" command.';
		case 429:
			return 'Rate limited by model0 API (429). Please wait and try again.';
		case 500:
		case 502:
		case 503:
			return `model0 API server error (${status}). Please try again later.`;
		default:
			return `model0 API request failed: ${status} - ${body}`;
	}
}

export function convertToolMode(toolMode: number): string {
	switch (toolMode) {
		case 0:
			return 'auto';
		case 1:
			return 'required';
		default:
			return 'auto';
	}
}

export function convertToolsToV0Format(tools: ChatToolInput[]): V0Tool[] {
	return tools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema || {}
		}
	}));
}

function isTextPart(part: Record<string, unknown>): part is { value: string } {
	return typeof part.value === 'string';
}

function isToolCallPart(part: Record<string, unknown>): boolean {
	return (
		typeof part.callId === 'string' &&
		typeof part.name === 'string' &&
		'input' in part
	);
}

function isToolResultPart(part: Record<string, unknown>): boolean {
	return (
		typeof part.callId === 'string' && 'content' in part && !('name' in part)
	);
}

export function convertMessages(messages: ChatMessageInput[]): V0ChatMessage[] {
	return messages.map((msg) => {
		const role = msg.role === 1 ? 'user' : 'assistant';
		const v0Message: V0ChatMessage = {
			role,
			content: ''
		};

		const textParts: string[] = [];
		const toolCalls: V0ToolCall[] = [];
		let toolCallId: string | undefined;

		for (const part of msg.content) {
			if (isTextPart(part)) {
				textParts.push(part.value);
			} else if (isToolCallPart(part)) {
				toolCalls.push({
					id: part.callId as string,
					type: 'function',
					function: {
						name: part.name as string,
						arguments: JSON.stringify(part.input)
					}
				});
			} else if (isToolResultPart(part)) {
				toolCallId = part.callId as string;
				const content = part.content as Array<Record<string, unknown>>;
				const resultTexts = content.filter(isTextPart).map((tp) => tp.value);
				textParts.push(...resultTexts);
			}
		}

		v0Message.content = textParts.join('');

		if (toolCalls.length > 0) {
			v0Message.tool_calls = toolCalls;
		}

		if (toolCallId) {
			v0Message.tool_call_id = toolCallId;
		}

		return v0Message;
	});
}

export function extractTextFromMessage(message: ChatMessageInput): string {
	return message.content
		.filter(isTextPart)
		.map((part) => part.value)
		.join('');
}

export function parseV0Response(message: {
	content: string;
	tool_calls?: V0ToolCall[];
}): ResponsePart[] {
	const parts: ResponsePart[] = [];

	if (message.content) {
		parts.push({ type: 'text', text: message.content });
	}

	if (message.tool_calls && message.tool_calls.length > 0) {
		for (const toolCall of message.tool_calls) {
			if (toolCall.type === 'function' && toolCall.function) {
				try {
					const input = JSON.parse(toolCall.function.arguments);
					parts.push({
						type: 'tool_call',
						toolCallId: toolCall.id,
						toolName: toolCall.function.name,
						toolInput: input
					});
				} catch {
					parts.push({
						type: 'tool_call',
						toolCallId: toolCall.id,
						toolName: toolCall.function.name,
						toolInput: { arguments: toolCall.function.arguments }
					});
				}
			}
		}
	}

	return parts;
}
