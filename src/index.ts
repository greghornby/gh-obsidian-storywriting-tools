import { Plugin } from 'obsidian';
import { FrontmatterButtons } from './FrontmatterButtons';
import { PinnedMenu } from './PinnedMenu';

export default class GHStoryWritingTools extends Plugin {
  private pinnedMenu = new PinnedMenu(this);
  private frontmatterButtons = new FrontmatterButtons(this, this.pinnedMenu);

  async onload() {
    this.pinnedMenu.register();
    this.frontmatterButtons.register();
  }

  onunload() {
    this.frontmatterButtons.unregister();
    this.pinnedMenu.unregister();
  }
}
