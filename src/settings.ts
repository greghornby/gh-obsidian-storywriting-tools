export interface GHStoryWritingToolsSettings {
  storyToolsGlob: string;
  enableStoryLinter: boolean;
  enforceBlankLinesBetweenParagraphs: boolean;
  collapseExcessBlankLinesToOne: boolean;
}

export const DEFAULT_SETTINGS: GHStoryWritingToolsSettings = {
  storyToolsGlob: '**/*.md',
  enableStoryLinter: false,
  enforceBlankLinesBetweenParagraphs: false,
  collapseExcessBlankLinesToOne: false,
};
