import {
	CancellationToken,
	ExtensionContext,
	LanguageModelChatInformation,
	LanguageModelChatMessage,
	LanguageModelChatProvider,
	LanguageModelChatTool,
	LanguageModelChatToolMode,
	LanguageModelResponsePart,
	LanguageModelTextPart,
	LanguageModelToolCallPart,
	Progress,
	ProvideLanguageModelChatResponseOptions,
	window,
	InputBoxOptions
} from 'vscode';
import {
	V0ChatMessage,
	V0ChatRequest,
	V0ChatResponse,
	ChatToolInput,
	convertMessages,
	convertToolMode,
	convertToolsToV0Format,
	extractTextFromMessage,
	fetchWithRetry,
	formatApiError,
	parseV0Response
} from './utils';

function getV0ModelInfo(
	id: string,
	name: string,
	description: string,
	maxInputTokens: number,
	maxOutputTokens: number
): LanguageModelChatInformation {
	return {
		id,
		name,
		tooltip: `v0 ${name} - ${description}`,
		family: 'v0',
		maxInputTokens,
		maxOutputTokens,
		version: '1.5.0',
		capabilities: {
			toolCalling: true,
			imageInput: true
		}
	};
}

function chatToolToInput(tool: LanguageModelChatTool): ChatToolInput {
	return {
		name: tool.name,
		description: tool.description,
		inputSchema: tool.inputSchema
	};
}

export class V0ChatModelProvider implements LanguageModelChatProvider {
	private static readonly API_KEY_SECRET = 'v0.apiKey';
	private static readonly BASE_URL = 'https://api.v0.dev';

	constructor(private context: ExtensionContext) {}

	async provideLanguageModelChatInformation(
		options: { silent: boolean },
		_token: CancellationToken
	): Promise<LanguageModelChatInformation[]> {
		const apiKey = await this.context.secrets.get(
			V0ChatModelProvider.API_KEY_SECRET
		);

		if (!apiKey) {
			if (options.silent) {
				return [];
			} else {
				await this.promptForApiKey();
				const newApiKey = await this.context.secrets.get(
					V0ChatModelProvider.API_KEY_SECRET
				);
				if (!newApiKey) {
					return [];
				}
			}
		}

		return [
			getV0ModelInfo(
				'model0-1.5-md',
				'model0-1.5-md',
				'For everyday tasks and UI generation',
				128000,
				64000
			),
			getV0ModelInfo(
				'model0-1.5-lg',
				'model0-1.5-lg',
				'For advanced thinking or reasoning',
				512000,
				64000
			)
		];
	}

	async provideLanguageModelChatResponse(
		model: LanguageModelChatInformation,
		messages: Array<LanguageModelChatMessage>,
		options: ProvideLanguageModelChatResponseOptions,
		progress: Progress<LanguageModelResponsePart>,
		token: CancellationToken
	): Promise<void> {
		const apiKey = await this.context.secrets.get(
			V0ChatModelProvider.API_KEY_SECRET
		);

		if (!apiKey) {
			progress.report(
				new LanguageModelTextPart(
					"Error: model0 API key not configured. Please run the 'Manage model0 API Key' command."
				)
			);
			return;
		}

		try {
			const v0Messages = convertMessages(messages as never[]);
			const response = await this.makeV0Request(
				model.id,
				v0Messages,
				apiKey,
				options.tools,
				options.toolMode,
				token
			);

			if (response && response.choices && response.choices.length > 0) {
				const message = response.choices[0].message;
				if (message) {
					const parts = parseV0Response(message);
					for (const part of parts) {
						if (part.type === 'text' && part.text) {
							progress.report(new LanguageModelTextPart(part.text));
						} else if (part.type === 'tool_call') {
							progress.report(
								new LanguageModelToolCallPart(
									part.toolCallId!,
									part.toolName!,
									part.toolInput as object
								)
							);
						}
					}
				} else {
					progress.report(
						new LanguageModelTextPart('Error: No response message from model0 API')
					);
				}
			} else {
				progress.report(
					new LanguageModelTextPart('Error: No response from model0 API')
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			progress.report(new LanguageModelTextPart(`Error: ${errorMessage}`));
		}
	}

	async provideTokenCount(
		_model: LanguageModelChatInformation,
		text: string | LanguageModelChatMessage,
		_token: CancellationToken
	): Promise<number> {
		const textContent =
			typeof text === 'string' ? text : extractTextFromMessage(text as never);
		return Math.ceil(textContent.length / 4);
	}

	async manageApiKey(): Promise<void> {
		const options: InputBoxOptions = {
			prompt: 'Enter your model0 API key',
			password: true,
			placeHolder: 'v0_...',
			ignoreFocusOut: true
		};

		const apiKey = await window.showInputBox(options);

		if (!apiKey) {
			return;
		}

		if (!apiKey.startsWith('v0_')) {
			const confirm = await window.showWarningMessage(
				'The API key does not start with "v0_". It may be invalid. Save anyway?',
				{ modal: true },
				'Save Anyway'
			);
			if (!confirm) {
				return;
			}
		}

		await this.context.secrets.store(
			V0ChatModelProvider.API_KEY_SECRET,
			apiKey
		);
		window.showInformationMessage('model0 API key saved successfully!');
	}

	private async promptForApiKey(): Promise<void> {
		const result = await window.showInformationMessage(
			'model0 API key is required to use model0s. Would you like to configure it now?',
			'Configure API Key',
			'Cancel'
		);

		if (result === 'Configure API Key') {
			await this.manageApiKey();
		}
	}

	private async makeV0Request(
		modelId: string,
		messages: V0ChatMessage[],
		apiKey: string,
		tools: readonly LanguageModelChatTool[] | undefined,
		toolMode: LanguageModelChatToolMode,
		token: CancellationToken
	): Promise<V0ChatResponse> {
		const requestBody: V0ChatRequest = {
			model: modelId,
			messages,
			max_completion_tokens: 64_000
		};

		if (tools && tools.length > 0) {
			requestBody.tools = convertToolsToV0Format(tools.map(chatToolToInput));
			requestBody.tool_choice = convertToolMode(toolMode as number);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30_000);
		const cancelListener = token.onCancellationRequested(() =>
			controller.abort()
		);

		try {
			const response = await fetchWithRetry(
				`${V0ChatModelProvider.BASE_URL}/v1/chat/completions`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`
					},
					body: JSON.stringify(requestBody),
					signal: controller.signal
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				const message = formatApiError(response.status, errorText);
				throw new Error(message);
			}

			return await response.json();
		} finally {
			cancelListener.dispose();
			clearTimeout(timeout);
		}
	}
}
