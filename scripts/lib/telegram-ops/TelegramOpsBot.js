/**
 * TelegramOpsBot — facade over domain services with compat named exports.
 */

import { createTelegramOpsDeps } from './createDeps.js';
import { ScraperOpsService } from './services/ScraperOpsService.js';
import { LinkedInOpsService } from './services/LinkedInOpsService.js';
import { AnalyticsOpsService } from './services/AnalyticsOpsService.js';
import { SystemOpsService } from './services/SystemOpsService.js';
import { ConversationFlowService } from './services/ConversationFlowService.js';

export class TelegramOpsBot {
  constructor(deps = createTelegramOpsDeps()) {
    this.deps = deps;
    this.scraper = new ScraperOpsService(deps);
    this.linkedin = new LinkedInOpsService(deps);
    this.analytics = new AnalyticsOpsService(deps);
    this.system = new SystemOpsService(deps);
    this.flows = new ConversationFlowService(deps);
  }

  get sendTelegramMessage() {
    return this.deps.sendTelegramMessage;
  }

  get callTelegramApi() {
    return this.deps.callTelegramApi;
  }

  // Conversation / nav
  handleStartCommand(...a) { return this.flows.handleStartCommand(...a); }
  handleMenuCommand(...a) { return this.flows.handleMenuCommand(...a); }
  handleHelpAction(...a) { return this.flows.handleHelpAction(...a); }

  // Scraper
  handleScraperMenu(...a) { return this.scraper.handleScraperMenu(...a); }
  handleScrapeAction(...a) { return this.scraper.handleScrapeAction(...a); }
  handleAddArticleAction(...a) { return this.scraper.handleAddArticleAction(...a); }
  handleArticleUrlInput(...a) { return this.scraper.handleArticleUrlInput(...a); }
  handleSourceConfirmation(...a) { return this.scraper.handleSourceConfirmation(...a); }
  handleOriginalSourceInput(...a) { return this.scraper.handleOriginalSourceInput(...a); }
  handleDeleteArticleAction(...a) { return this.scraper.handleDeleteArticleAction(...a); }
  handleDeleteUrlInput(...a) { return this.scraper.handleDeleteUrlInput(...a); }
  handleDeleteArticleConfirm(...a) { return this.scraper.handleDeleteArticleConfirm(...a); }

  // LinkedIn
  handleSocialMenu(...a) { return this.linkedin.handleSocialMenu(...a); }
  handleLinkedInCommand(...a) { return this.linkedin.handleLinkedInCommand(...a); }
  handleLinkedInGroupsDigest(...a) { return this.linkedin.handleLinkedInGroupsDigest(...a); }
  handleCreateDigestAction(...a) { return this.linkedin.handleCreateDigestAction(...a); }
  handleCleanPendingAction(...a) { return this.linkedin.handleCleanPendingAction(...a); }
  handleConfirmCleanAction(...a) { return this.linkedin.handleConfirmCleanAction(...a); }
  handleDigestEditInput(...a) { return this.linkedin.handleDigestEditInput(...a); }
  handleDigestCallback(...a) { return this.linkedin.handleDigestCallback(...a); }

  // Analytics
  handleAnalyticsMenu(...a) { return this.analytics.handleAnalyticsMenu(...a); }
  handleStatusAction(...a) { return this.analytics.handleStatusAction(...a); }
  handleStatsAction(...a) { return this.analytics.handleStatsAction(...a); }
  handleDatabaseAction(...a) { return this.analytics.handleDatabaseAction(...a); }

  // System
  handleSystemManagementMenu(...a) { return this.system.handleSystemManagementMenu(...a); }
  handleHealthAction(...a) { return this.system.handleHealthAction(...a); }
  handleWebhookResetAction(...a) { return this.system.handleWebhookResetAction(...a); }
  handleN8nStatusAction(...a) { return this.system.handleN8nStatusAction(...a); }
  handleN8nTrialResetAction(...a) { return this.system.handleN8nTrialResetAction(...a); }
  handleN8nNotificationsMenu(...a) { return this.system.handleN8nNotificationsMenu(...a); }
  handleN8nNotificationsToggle(...a) { return this.system.handleN8nNotificationsToggle(...a); }
  handleChatBackendMenu(...a) { return this.system.handleChatBackendMenu(...a); }
  handleChatBackendToggle(...a) { return this.system.handleChatBackendToggle(...a); }
  handleGitHubAction(...a) { return this.system.handleGitHubAction(...a); }
  handleGitHubWorkflowToggle(...a) { return this.system.handleGitHubWorkflowToggle(...a); }
  setBotCommands(...a) { return this.system.setBotCommands(...a); }
}

export function createTelegramOpsBot() {
  return new TelegramOpsBot();
}

const bot = createTelegramOpsBot();

export const handleStartCommand = (...a) => bot.flows.handleStartCommand(...a);
export const handleMenuCommand = (...a) => bot.flows.handleMenuCommand(...a);
export const handleHelpAction = (...a) => bot.flows.handleHelpAction(...a);

export const handleScraperMenu = (...a) => bot.scraper.handleScraperMenu(...a);
export const handleScrapeAction = (...a) => bot.scraper.handleScrapeAction(...a);
export const handleAddArticleAction = (...a) => bot.scraper.handleAddArticleAction(...a);
export const handleArticleUrlInput = (...a) => bot.scraper.handleArticleUrlInput(...a);
export const handleSourceConfirmation = (...a) => bot.scraper.handleSourceConfirmation(...a);
export const handleOriginalSourceInput = (...a) => bot.scraper.handleOriginalSourceInput(...a);
export const handleDeleteArticleAction = (...a) => bot.scraper.handleDeleteArticleAction(...a);
export const handleDeleteUrlInput = (...a) => bot.scraper.handleDeleteUrlInput(...a);
export const handleDeleteArticleConfirm = (...a) => bot.scraper.handleDeleteArticleConfirm(...a);

export const handleSocialMenu = (...a) => bot.linkedin.handleSocialMenu(...a);
export const handleLinkedInCommand = (...a) => bot.linkedin.handleLinkedInCommand(...a);
export const handleLinkedInGroupsDigest = (...a) => bot.linkedin.handleLinkedInGroupsDigest(...a);
export const handleCreateDigestAction = (...a) => bot.linkedin.handleCreateDigestAction(...a);
export const handleCleanPendingAction = (...a) => bot.linkedin.handleCleanPendingAction(...a);
export const handleConfirmCleanAction = (...a) => bot.linkedin.handleConfirmCleanAction(...a);
export const handleDigestEditInput = (...a) => bot.linkedin.handleDigestEditInput(...a);
export const handleDigestCallback = (...a) => bot.linkedin.handleDigestCallback(...a);

export const handleAnalyticsMenu = (...a) => bot.analytics.handleAnalyticsMenu(...a);
export const handleStatusAction = (...a) => bot.analytics.handleStatusAction(...a);
export const handleStatsAction = (...a) => bot.analytics.handleStatsAction(...a);
export const handleDatabaseAction = (...a) => bot.analytics.handleDatabaseAction(...a);

export const handleSystemManagementMenu = (...a) => bot.system.handleSystemManagementMenu(...a);
export const handleHealthAction = (...a) => bot.system.handleHealthAction(...a);
export const handleWebhookResetAction = (...a) => bot.system.handleWebhookResetAction(...a);
export const handleN8nStatusAction = (...a) => bot.system.handleN8nStatusAction(...a);
export const handleN8nTrialResetAction = (...a) => bot.system.handleN8nTrialResetAction(...a);
export const handleN8nNotificationsMenu = (...a) => bot.system.handleN8nNotificationsMenu(...a);
export const handleN8nNotificationsToggle = (...a) => bot.system.handleN8nNotificationsToggle(...a);
export const handleChatBackendMenu = (...a) => bot.system.handleChatBackendMenu(...a);
export const handleChatBackendToggle = (...a) => bot.system.handleChatBackendToggle(...a);
export const handleGitHubAction = (...a) => bot.system.handleGitHubAction(...a);
export const handleGitHubWorkflowToggle = (...a) => bot.system.handleGitHubWorkflowToggle(...a);
export const setBotCommands = (...a) => bot.system.setBotCommands(...a);

export const sendTelegramMessage = bot.sendTelegramMessage;

export default {
  sendTelegramMessage,
  handleStartCommand,
  handleMenuCommand,
  handleScraperMenu,
  handleSocialMenu,
  handleAnalyticsMenu,
  handleLinkedInCommand,
  handleLinkedInGroupsDigest,
  handleCreateDigestAction,
  handleCleanPendingAction,
  handleConfirmCleanAction,
  handleAddArticleAction,
  handleArticleUrlInput,
  handleSourceConfirmation,
  handleOriginalSourceInput,
  handleDigestEditInput,
  handleDigestCallback,
  handleDeleteArticleAction,
  handleDeleteUrlInput,
  handleDeleteArticleConfirm,
  handleScrapeAction,
  handleHealthAction,
  handleStatusAction,
  handleStatsAction,
  handleDatabaseAction,
  handleSystemManagementMenu,
  handleGitHubAction,
  handleGitHubWorkflowToggle,
  handleHelpAction,
  handleN8nStatusAction,
  handleN8nTrialResetAction,
  handleWebhookResetAction,
  handleN8nNotificationsMenu,
  handleN8nNotificationsToggle,
  handleChatBackendMenu,
  handleChatBackendToggle,
  setBotCommands,
};
