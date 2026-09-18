/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LanguageModelChat, type ChatRequest } from 'vscode';
import { IAuthenticationService } from '../../../platform/authentication/common/authentication';
import { IConfigurationService } from '../../../platform/configuration/common/configurationService';
import { ChatEndpointFamily, EmbeddingsEndpointFamily, ICompletionModelInformation, IEndpointProvider } from '../../../platform/endpoint/common/endpointProvider';
import { createLocalOpenAIChatModelInformation, getLocalOpenAIModelSettings, isLocalOpenAIModelConfigurationChange, resolveLocalOpenAIChatCompletionsUrl } from '../../../platform/endpoint/common/localOpenAIModel';
import { ILogService } from '../../../platform/log/common/logService';
import { IChatEndpoint, IEmbeddingsEndpoint } from '../../../platform/networking/common/networking';
import { Emitter, Event } from '../../../util/vs/base/common/event';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { OpenAIEndpoint } from '../../byok/node/openAIEndpoint';


export class ProductionEndpointProvider extends Disposable implements IEndpointProvider {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidModelsRefresh = this._register(new Emitter<void>());
	readonly onDidModelsRefresh: Event<void> = this._onDidModelsRefresh.event;

	private _chatEndpoints: Map<string, IChatEndpoint> = new Map();

	constructor(
		@ILogService protected readonly _logService: ILogService,
		@IConfigurationService protected readonly _configService: IConfigurationService,
		@IInstantiationService protected readonly _instantiationService: IInstantiationService,
		@IAuthenticationService protected readonly _authService: IAuthenticationService,
	) {
		super();
		this._register(this._configService.onDidChangeConfiguration(e => {
			if (isLocalOpenAIModelConfigurationChange(e)) {
				this._chatEndpoints.clear();
				this._onDidModelsRefresh.fire();
			}
		}));
	}

	private getLocalOpenAIChatEndpoint(): IChatEndpoint {
		const settings = getLocalOpenAIModelSettings(this._configService);
		if (!settings) {
			throw new Error('A local OpenAI-compatible endpoint is required. Configure gunner.chat.localModel.baseUrl and an API key or XAI_API_KEY/OPENAI_API_KEY.');
		}

		const cacheKey = `local:${settings.model}:${settings.baseUrl}`;
		let chatEndpoint = this._chatEndpoints.get(cacheKey);
		if (!chatEndpoint) {
			const modelMetadata = createLocalOpenAIChatModelInformation(settings);
			chatEndpoint = this._instantiationService.createInstance(
				OpenAIEndpoint,
				modelMetadata,
				settings.apiKey,
				resolveLocalOpenAIChatCompletionsUrl(settings.baseUrl),
			);
			this._chatEndpoints.set(cacheKey, chatEndpoint);
			this._logService.info(`Using local OpenAI-compatible model ${settings.model} at ${settings.baseUrl}`);
		}
		return chatEndpoint;
	}

	async getChatEndpoint(_requestOrFamilyOrModel: LanguageModelChat | ChatRequest | ChatEndpointFamily): Promise<IChatEndpoint> {
		this._logService.trace(`Resolving chat model`);
		return this.getLocalOpenAIChatEndpoint();
	}

	async getEmbeddingsEndpoint(_family?: EmbeddingsEndpointFamily): Promise<IEmbeddingsEndpoint> {
		throw new Error('Embeddings are unavailable in the local-only build.');
	}

	async getAllCompletionModels(_forceRefresh?: boolean): Promise<ICompletionModelInformation[]> {
		return [];
	}

	async getAllChatEndpoints(): Promise<IChatEndpoint[]> {
		return [this.getLocalOpenAIChatEndpoint()];
	}
}
