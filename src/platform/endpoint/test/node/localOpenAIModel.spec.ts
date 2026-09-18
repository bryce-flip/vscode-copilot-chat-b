/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, describe, expect, it } from 'vitest';
import { TokenizerType } from '../../../../util/common/tokenizer';
import { DisposableStore } from '../../../../util/vs/base/common/lifecycle';
import { ConfigKey, IConfigurationService } from '../../../configuration/common/configurationService';
import { InMemoryConfigurationService } from '../../../configuration/test/common/inMemoryConfigurationService';
import { createPlatformServices } from '../../../test/node/services';
import { createLocalOpenAIChatModelInformation, getLocalOpenAIModelSettings, isLocalOpenAIModelConfigured, resolveLocalOpenAIChatCompletionsUrl } from '../../common/localOpenAIModel';

describe('local OpenAI model settings', () => {
	const disposables = new DisposableStore();

	afterEach(() => {
		disposables.clear();
	});

	function createConfigService(): InMemoryConfigurationService {
		const testingServiceCollection = createPlatformServices();
		const accessor = disposables.add(testingServiceCollection.createTestingAccessor());
		return new InMemoryConfigurationService(accessor.get(IConfigurationService));
	}

	it('is not configured until enabled with api key and base url', async () => {
		const config = createConfigService();
		expect(isLocalOpenAIModelConfigured(config)).toBe(false);

		await config.setConfig(ConfigKey.LocalModelEnabled, true);
		expect(isLocalOpenAIModelConfigured(config)).toBe(false);

		await config.setConfig(ConfigKey.LocalModelApiKey, 'test-key');
		await config.setConfig(ConfigKey.LocalModelBaseUrl, 'https://api.x.ai/v1');
		expect(isLocalOpenAIModelConfigured(config)).toBe(true);
	});

	it('uses grok defaults and resolves OpenAI-compatible urls', async () => {
		const config = createConfigService();
		await config.setConfig(ConfigKey.LocalModelEnabled, true);
		await config.setConfig(ConfigKey.LocalModelApiKey, 'test-key');
		await config.setConfig(ConfigKey.LocalModelBaseUrl, 'https://api.x.ai/v1');

		const settings = getLocalOpenAIModelSettings(config);
		expect(settings).toMatchObject({
			apiKey: 'test-key',
			baseUrl: 'https://api.x.ai/v1',
			model: 'grok-code-fast-1',
			name: 'Grok Code Fast 1',
			maxInputTokens: 120000,
			maxOutputTokens: 32000,
			toolCalling: true,
			vision: false,
		});

		const modelInfo = createLocalOpenAIChatModelInformation(settings!);
		expect(modelInfo.id).toBe('grok-code-fast-1');
		expect(modelInfo.vendor).toBe('copilot');
		expect(modelInfo.is_chat_default).toBe(true);
		expect(modelInfo.capabilities.tokenizer).toBe(TokenizerType.O200K);
		expect(modelInfo.capabilities.supports.tool_calls).toBe(true);

		expect(resolveLocalOpenAIChatCompletionsUrl('https://api.x.ai/v1')).toBe('https://api.x.ai/v1/chat/completions');
		expect(resolveLocalOpenAIChatCompletionsUrl('https://api.x.ai/v1/')).toBe('https://api.x.ai/v1/chat/completions');
		expect(resolveLocalOpenAIChatCompletionsUrl('https://api.x.ai/v1/chat/completions')).toBe('https://api.x.ai/v1/chat/completions');
		expect(resolveLocalOpenAIChatCompletionsUrl('https://example.com')).toBe('https://example.com/v1/chat/completions');
	});
});
