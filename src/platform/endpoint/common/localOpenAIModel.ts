/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ConfigurationChangeEvent } from 'vscode';
import { TokenizerType } from '../../../util/common/tokenizer';
import { ConfigKey, IConfigurationService } from '../../configuration/common/configurationService';
import { IChatModelInformation, ModelSupportedEndpoint } from './endpointProvider';

export const DEFAULT_LOCAL_OPENAI_MODEL_ID = 'grok-code-fast-1';

export interface LocalOpenAIModelSettings {
	readonly apiKey: string;
	readonly baseUrl: string;
	readonly model: string;
	readonly name: string;
	readonly maxInputTokens: number;
	readonly maxOutputTokens: number;
	readonly toolCalling: boolean;
	readonly vision: boolean;
}

const LOCAL_MODEL_CONFIG_KEYS = [
	ConfigKey.LocalModelEnabled,
	ConfigKey.LocalModelApiKey,
	ConfigKey.LocalModelBaseUrl,
	ConfigKey.LocalModelId,
	ConfigKey.LocalModelName,
	ConfigKey.LocalModelMaxInputTokens,
	ConfigKey.LocalModelMaxOutputTokens,
	ConfigKey.LocalModelToolCalling,
	ConfigKey.LocalModelVision,
] as const;

export function isLocalOpenAIModelConfigured(configurationService: IConfigurationService): boolean {
	return getLocalOpenAIModelSettings(configurationService) !== undefined;
}

export function isLocalOpenAIModelConfigurationChange(e: ConfigurationChangeEvent): boolean {
	return LOCAL_MODEL_CONFIG_KEYS.some(key => e.affectsConfiguration(key.fullyQualifiedId));
}

export function getLocalOpenAIModelSettings(configurationService: IConfigurationService): LocalOpenAIModelSettings | undefined {
	if (!configurationService.getConfig(ConfigKey.LocalModelEnabled)) {
		return undefined;
	}

	const apiKey = configurationService.getConfig(ConfigKey.LocalModelApiKey).trim();
	const baseUrl = configurationService.getConfig(ConfigKey.LocalModelBaseUrl).trim();
	if (!apiKey || !baseUrl) {
		return undefined;
	}

	const model = configurationService.getConfig(ConfigKey.LocalModelId).trim() || DEFAULT_LOCAL_OPENAI_MODEL_ID;
	const configuredName = configurationService.getConfig(ConfigKey.LocalModelName).trim();
	const maxInputTokens = configurationService.getConfig(ConfigKey.LocalModelMaxInputTokens);
	const maxOutputTokens = configurationService.getConfig(ConfigKey.LocalModelMaxOutputTokens);

	return {
		apiKey,
		baseUrl,
		model,
		name: configuredName || humanizeModelId(model),
		maxInputTokens: maxInputTokens > 0 ? maxInputTokens : defaultMaxInputTokens(model),
		maxOutputTokens: maxOutputTokens > 0 ? maxOutputTokens : defaultMaxOutputTokens(model),
		toolCalling: configurationService.getConfig(ConfigKey.LocalModelToolCalling),
		vision: configurationService.getConfig(ConfigKey.LocalModelVision),
	};
}

export function resolveLocalOpenAIChatCompletionsUrl(url: string): string {
	if (url.includes('/responses') || url.includes('/chat/completions')) {
		return url;
	}

	if (url.endsWith('/')) {
		url = url.slice(0, -1);
	}

	if (/\/v\d+$/.test(url)) {
		return `${url}/chat/completions`;
	}

	return `${url}/v1/chat/completions`;
}

export function createLocalOpenAIChatModelInformation(settings: LocalOpenAIModelSettings): IChatModelInformation {
	const contextWindow = settings.maxInputTokens + settings.maxOutputTokens;
	return {
		id: settings.model,
		name: settings.name,
		vendor: 'copilot',
		version: '1.0.0',
		capabilities: {
			type: 'chat',
			family: settings.model,
			supports: {
				streaming: true,
				tool_calls: settings.toolCalling,
				vision: settings.vision,
				parallel_tool_calls: settings.toolCalling,
			},
			tokenizer: TokenizerType.O200K,
			limits: {
				max_context_window_tokens: contextWindow,
				max_prompt_tokens: settings.maxInputTokens,
				max_output_tokens: settings.maxOutputTokens,
			},
		},
		is_chat_default: true,
		is_chat_fallback: true,
		model_picker_enabled: true,
		supported_endpoints: [ModelSupportedEndpoint.ChatCompletions],
	};
}

function defaultMaxInputTokens(modelId: string): number {
	if (modelId.startsWith('grok-code') || /^grok-[4-9]/.test(modelId)) {
		return 120000;
	}
	return 100000;
}

function defaultMaxOutputTokens(modelId: string): number {
	if (modelId.startsWith('grok-code') || /^grok-[4-9]/.test(modelId)) {
		return 32000;
	}
	return 8192;
}

function humanizeModelId(modelId: string): string {
	return modelId
		.split(/[-_]/)
		.filter(part => part.length > 0)
		.map(part => /^\d+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
