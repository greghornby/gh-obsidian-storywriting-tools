export interface StoryWritingToolsSettings {
  storyToolsGlob: string;
  enableStoryLinter: boolean;
  enforceBlankLinesBetweenParagraphs: boolean;
  collapseExcessBlankLinesToOne: boolean;
}

export const DEFAULT_SETTINGS: StoryWritingToolsSettings = {
  storyToolsGlob: '**/*.md',
  enableStoryLinter: false,
  enforceBlankLinesBetweenParagraphs: false,
  collapseExcessBlankLinesToOne: false,
};
