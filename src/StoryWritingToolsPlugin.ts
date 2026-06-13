import { Plugin } from 'obsidian';
import { PageController } from './PageController';
import { StoryWritingToolsSettingTab } from './StoryWritingToolsSettingTab';
import { PinnedStoryButtons } from './PinnedStoryButtons';
import {
  DEFAULT_SETTINGS,
  GHStoryWritingToolsSettings,
} from './settings';
import { State } from './State';
import { StoryHUD } from './StoryHUD';
import { StoryLinter } from './StoryLinter';

export class StoryWritingToolsPlugin extends Plugin {
  settings: GHStoryWritingToolsSettings = {...DEFAULT_SETTINGS};

  private storyHUD!: StoryHUD;
  private state!: State;
  private pageController!: PageController;
  private pinnedStoryButtons!: PinnedStoryButtons;
  private storyLinter: StoryLinter | null = null;

  async onload() {
    await this.loadSettings();

    this.state = new State(this);
    await this.state.load();

    this.storyHUD = new StoryHUD(this, this.settings.pinnedMenuIncludeGlob);
    this.pageController = new PageController(this.state, this.storyHUD);
    this.pinnedStoryButtons = new PinnedStoryButtons(
      this.storyHUD,
      this.state,
      this.pageController,
    );
    this.storyLinter = new StoryLinter(this, this.settings);

    this.addSettingTab(new StoryWritingToolsSettingTab(this.app, this));

    this.storyHUD.register();
    this.pageController.register();
    this.pinnedStoryButtons.register();
    this.storyLinter.register();
  }

  onunload() {
    this.storyLinter?.unregister();
    this.pinnedStoryButtons.unregister();
    this.pageController.unregister();
    this.storyHUD.unregister();
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
    this.storyHUD.setIncludeGlob(this.settings.pinnedMenuIncludeGlob);
    this.storyHUD.refresh();
    this.pageController.render();
  }
}
