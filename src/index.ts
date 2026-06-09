import { Plugin } from 'obsidian';
import { FrontmatterButtons } from './FrontmatterButtons';
import { GHStoryWritingToolsSettingTab } from './GHStoryWritingToolsSettingTab';
import { PinnedMenu } from './PinnedMenu';
import {
  DEFAULT_SETTINGS,
  GHStoryWritingToolsSettings,
} from './settings';
import { StoryLinter } from './StoryLinter';

export default class GHStoryWritingTools extends Plugin {
  settings: GHStoryWritingToolsSettings = {...DEFAULT_SETTINGS};

  private pinnedMenu!: PinnedMenu;
  private frontmatterButtons!: FrontmatterButtons;
  private storyLinter: StoryLinter | null = null;

  async onload() {
    await this.loadSettings();

    this.pinnedMenu = new PinnedMenu(this, this.settings.pinnedMenuIncludeGlob);
    this.frontmatterButtons = new FrontmatterButtons(this, this.pinnedMenu);
    this.storyLinter = new StoryLinter(this, this.settings.storyLinterIncludeGlob);

    this.addSettingTab(new GHStoryWritingToolsSettingTab(this.app, this));

    this.pinnedMenu.register();
    this.frontmatterButtons.register();
    this.storyLinter.register();
  }

  onunload() {
    this.storyLinter?.unregister();
    this.frontmatterButtons.unregister();
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
    this.frontmatterButtons.refresh();
  }
}
