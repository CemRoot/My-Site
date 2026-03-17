/**
 * Window augmentations for third-party embed scripts
 */

interface TwttrWidgets {
  load: (element?: HTMLElement) => void;
}

interface TikTokEmbedLib {
  render: (elements: NodeListOf<Element>) => void;
}

interface Window {
  twttr?: {
    widgets: TwttrWidgets;
  };
  tiktokEmbed?: {
    lib: TikTokEmbedLib;
  };
}
