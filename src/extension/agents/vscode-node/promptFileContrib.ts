/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IConfigurationService } from '../../../platform/configuration/common/configurationService';
import { Disposable, MutableDisposable } from '../../../util/vs/base/common/lifecycle';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { IExtensionContribution } from '../../common/contributions';
import { AskAgentProvider } from './askAgentProvider';
import { EditModeAgentProvider } from './editModeAgentProvider';
import { ExploreAgentProvider } from './exploreAgentProvider';
import { PlanAgentProvider } from './planAgentProvider';

export class PromptFileContribution extends Disposable implements IExtensionContribution {
	readonly id = 'PromptFiles';

	constructor(
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
	) {
		super();

		// Register custom agent provider
		if ('registerCustomAgentProvider' in vscode.chat) {
			const editModeProviderRegistration = this._register(new MutableDisposable<vscode.Disposable>());
			const editModeHiddenSetting = 'chat.editMode.hidden';
			const updateEditModeProvider = () => {
				const isEditModeHidden = configurationService.getNonExtensionConfig<boolean>(editModeHiddenSetting);
				if (!isEditModeHidden) {
					if (!editModeProviderRegistration.value) {
						editModeProviderRegistration.value = vscode.chat.registerCustomAgentProvider(instantiationService.createInstance(EditModeAgentProvider));
					}
				} else {
					editModeProviderRegistration.clear();
				}
			};

			updateEditModeProvider();
			this._register(configurationService.onDidChangeConfiguration(e => {
				if (e.affectsConfiguration(editModeHiddenSetting)) {
					updateEditModeProvider();
				}
			}));

			// Register Plan agent provider for dynamic settings-based customization
			const planProvider = instantiationService.createInstance(PlanAgentProvider);
			this._register(vscode.chat.registerCustomAgentProvider(planProvider));

			// Register Ask agent provider for read-only Q&A mode
			const askProvider = instantiationService.createInstance(AskAgentProvider);
			this._register(vscode.chat.registerCustomAgentProvider(askProvider));

			// Register Explore agent provider for code research subagent
			const exploreProvider = instantiationService.createInstance(ExploreAgentProvider);
			this._register(vscode.chat.registerCustomAgentProvider(exploreProvider));
		}

	}
}
