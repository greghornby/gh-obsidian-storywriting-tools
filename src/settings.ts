export interface GHStoryWritingToolsSettings {
  storyLinterIncludeGlob: string;
  pinnedMenuIncludeGlob: string;
  enforceBlankLinesBetweenParagraphs: boolean;
  collapseExcessBlankLinesToOne: boolean;
}

export const DEFAULT_SETTINGS: GHStoryWritingToolsSettings = {
  storyLinterIncludeGlob: '**/*.md',
  pinnedMenuIncludeGlob: '**/*.md',
  enforceBlankLinesBetweenParagraphs: false,
  collapseExcessBlankLinesToOne: false,
};
