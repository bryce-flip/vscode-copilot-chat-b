/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Commands ending with "Client" refer to the command ID used in the legacy Copilot extension.
// - These IDs should not appear in the package.json file
// - These IDs should be registered to support all functionality (except if this command needs to be supported when both extensions are loaded/active).
// Commands ending with "Chat" refer to the command ID used in the Copilot Chat extension.
// - These IDs should be used in package.json
// - These IDs should only be registered if they appear in the package.json (meaning the command palette) or if the command needs to be supported when both extensions are loaded/active.

export const CMDOpenPanelClient = 'gunner.generate';
export const CMDOpenPanelChat = 'gunner.chat.openSuggestionsPanel'; // "gunner.chat.generate" is already being used

export const CMDAcceptCursorPanelSolutionClient = 'gunner.acceptCursorPanelSolution';
export const CMDNavigatePreviousPanelSolutionClient = 'gunner.previousPanelSolution';
export const CMDNavigateNextPanelSolutionClient = 'gunner.nextPanelSolution';

export const CMDToggleStatusMenuClient = 'gunner.toggleStatusMenu';
export const CMDToggleStatusMenuChat = 'gunner.chat.toggleStatusMenu';

// Needs to be supported in both extensions when they are loaded/active. Requires a different ID.
export const CMDSendCompletionsFeedbackChat = 'gunner.chat.sendCompletionFeedback';

export const CMDEnableCompletionsChat = 'gunner.chat.completions.enable';
export const CMDDisableCompletionsChat = 'gunner.chat.completions.disable';
export const CMDToggleCompletionsChat = 'gunner.chat.completions.toggle';
export const CMDEnableCompletionsClient = 'gunner.completions.enable';
export const CMDDisableCompletionsClient = 'gunner.completions.disable';
export const CMDToggleCompletionsClient = 'gunner.completions.toggle';

export const CMDOpenLogsClient = 'gunner.openLogs';
export const CMDOpenDocumentationClient = 'gunner.openDocs';

// Existing chat command reused for diagnostics
export const CMDCollectDiagnosticsChat = 'gunner.debug.collectDiagnostics';

// Context variable that enable/disable panel-specific commands
export const CopilotPanelVisible = 'gunner.panelVisible';
export const ComparisonPanelVisible = 'gunner.comparisonPanelVisible';
export const HasMultipleCompletionModels = 'gunner.completions.hasMultipleModels';

export const CMDOpenModelPickerClient = 'gunner.openModelPicker';
export const CMDOpenModelPickerChat = 'gunner.chat.openModelPicker';