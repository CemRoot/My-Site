export function replaceTikTokBlockquote(markdown: string): string;
export function replaceTwitterBlockquote(markdown: string): string;
export function cleanSocialEmbedRemnants(markdown: string): string;
export function hasSourceSocialLeak(text: string): boolean;
export function stripSourceSocialLeaks(markdown: string): string;
export function removeEmbedArtifactNoise(markdown: string): string;
export function dedupeEmbedTokens(markdown: string): string;
