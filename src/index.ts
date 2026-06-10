import { Plugin } from 'obsidian';
import { GHStoryWritingToolsSettingTab } from './GHStoryWritingToolsSettingTab';
import { PinnedMenu } from './PinnedMenu';
import { PinnedStoryButtons } from './PinnedStoryButtons';
import {
  DEFAULT_SETTINGS,
  GHStoryWritingToolsSettings,
} from './settings';
import { StoryLinter } from './StoryLinter';

export default class GHStoryWritingTools extends Plugin {
  settings: GHStoryWritingToolsSettings = {...DEFAULT_SETTINGS};

  private pinnedMenu!: PinnedMenu;
  private pinnedStoryButtons!: PinnedStoryButtons;
  private storyLinter: StoryLinter | null = null;

  async onload() {
    await this.loadSettings();

    this.pinnedMenu = new PinnedMenu(this, this.settings.pinnedMenuIncludeGlob);
    this.pinnedStoryButtons = new PinnedStoryButtons(this.pinnedMenu);
    this.storyLinter = new StoryLinter(this, this.settings);

    this.addSettingTab(new GHStoryWritingToolsSettingTab(this.app, this));

    this.pinnedMenu.register();
    this.pinnedStoryButtons.register();
    this.storyLinter.register();
  }

  onunload() {
    this.storyLinter?.unregister();
    this.pinnedStoryButtons.unregister();
    this.pinnedMenu.unregister();
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData(),
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.storyLinter?.setIncludeGlob(this.settings.storyLinterIncludeGlob);
    this.pinnedMenu.setIncludeGlob(this.settings.pinnedMenuIncludeGlob);
    this.pinnedMenu.refresh();
  }
}
