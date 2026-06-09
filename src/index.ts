import { Plugin } from 'obsidian';
import { FrontmatterButtons } from './FrontmatterButtons';
import { PinnedMenu } from './PinnedMenu';
import { StoryLinter } from './StoryLinter';

export default class GHStoryWritingTools extends Plugin {
  private pinnedMenu = new PinnedMenu(this);
  private frontmatterButtons = new FrontmatterButtons(this, this.pinnedMenu);
  private storyLinter = new StoryLinter(this);

  async onload() {
    this.pinnedMenu.register();
    this.frontmatterButtons.register();
    this.storyLinter.register();
  }

  onunload() {
    this.storyLinter.unregister();
    this.frontmatterButtons.unregister();
    this.pinnedMenu.unregister();
  }
}
