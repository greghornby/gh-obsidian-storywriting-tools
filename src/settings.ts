export interface GHStoryWritingToolsSettings {
  storyLinterIncludeGlob: string;
  pinnedMenuIncludeGlob: string;
}

export const DEFAULT_SETTINGS: GHStoryWritingToolsSettings = {
  storyLinterIncludeGlob: '**/*.md',
  pinnedMenuIncludeGlob: '**/*.md',
};
