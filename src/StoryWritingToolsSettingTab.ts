import {
  App,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import type {StoryWritingToolsPlugin} from './StoryWritingToolsPlugin';

export class StoryWritingToolsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: StoryWritingToolsPlugin,
  ) {
    super(app, plugin);
  }

  display() {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Story Tools Glob')
      .setDesc('Only markdown files whose vault path matches this glob will use story tools.')
      .addText((text) => {
        text
          .setPlaceholder('**/*.md')
          .setValue(this.plugin.settings.storyToolsGlob)
          .onChange(async (value) => {
            this.plugin.settings.storyToolsGlob = value.trim() || '**/*.md';
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Enable Story Linter')
      .setDesc('Normalize matching markdown files when they are modified.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableStoryLinter)
          .onChange(async (value) => {
            this.plugin.settings.enableStoryLinter = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Enforce Blank Lines Between Paragraphs')
      .setDesc('Convert single line breaks in story body content into blank-line paragraph breaks.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enforceBlankLinesBetweenParagraphs)
          .onChange(async (value) => {
            this.plugin.settings.enforceBlankLinesBetweenParagraphs = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Collapse Excess Blank Lines To One')
      .setDesc('Convert runs of three or more newlines in story body content into a single blank line.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.collapseExcessBlankLinesToOne)
          .onChange(async (value) => {
            this.plugin.settings.collapseExcessBlankLinesToOne = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
