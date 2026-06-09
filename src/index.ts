import {
  MarkdownView,
  Plugin,
  WorkspaceLeaf,
} from 'obsidian';

export default class GHStoryWritingTools extends Plugin {
  private frontmatterButtons = new FrontmatterButtons(this);

  async onload() {
    this.frontmatterButtons.register();
  }

  onunload() {
    this.frontmatterButtons.unregister();
  }
}

type FrontmatterLeaf = Omit<WorkspaceLeaf, "view"> & {view: MarkdownView};
const isFrontmatterLeaf = (leaf: any): leaf is FrontmatterLeaf => leaf.view instanceof MarkdownView;

type FrontmatterTarget = {
  el: HTMLElement;
  filePath: string;
};

class FrontmatterButtons {
  private filesWithFrontmatterHidden = new Set<string>();

  constructor(private plugin: Plugin) {}

  register() {
    this.plugin.app.workspace.onLayoutReady(() => {
      this.sync();
    });

    this.plugin.registerEvent(
      this.plugin.app.workspace.on('active-leaf-change', () => {
        this.sync();
      }),
    );

    this.plugin.registerEvent(
      this.plugin.app.workspace.on('layout-change', () => {
        this.sync();
      }),
    );
  }

  unregister() {
    this.removeAll();
  }


  private sync() {
    const leaves = this.plugin.app.workspace.getLeavesOfType('markdown')
      .filter(leaf => isFrontmatterLeaf(leaf)) as FrontmatterLeaf[];

    for (const leaf of leaves) {
      const targets = this.getLeafTargets(leaf);
      if (targets.length === 0) {
        this.removeLeafButtons(leaf);
      }

      for (const target of targets) {
        this.syncTarget(target);
      }
    }
  }

  private syncTarget(target: FrontmatterTarget) {
    const button = this.getOrCreateButton(target);
    const isHidden = this.filesWithFrontmatterHidden.has(target.filePath);

    button.textContent = isHidden ? 'Show Metadata' : 'Hide Metadata';
    button.setAttribute('aria-pressed', String(isHidden));
    this.setFrontmatterCSS(target.el, isHidden);
  }

  private getOrCreateButton(target: FrontmatterTarget) {
    const existingButton = target.el.querySelector<HTMLButtonElement>(
      ':scope > .gh-frontmatter-visibility-toggle',
    );

    if (existingButton) {
      return existingButton;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gh-frontmatter-visibility-toggle';

    button.addEventListener('click', () => {
      this.toggleFrontmatterVisibility(target.filePath);
    });

    target.el.appendChild(button);
    return button;
  }

  private getLeafTargets(leaf: FrontmatterLeaf): FrontmatterTarget[] {
    const filePath = leaf.view.file?.path;
    if (!filePath) {
      return [];
    }

    const viewEls = leaf.view.containerEl.querySelectorAll<HTMLElement>(
      '.markdown-source-view, .markdown-preview-view',
    );

    return Array.from(viewEls).map((el) => ({
      el,
      filePath,
    }));
  }

  private toggleFrontmatterVisibility(filePath: string) {
    if (this.filesWithFrontmatterHidden.has(filePath)) {
      this.filesWithFrontmatterHidden.delete(filePath);
    } else {
      this.filesWithFrontmatterHidden.add(filePath);
    }
    this.sync();
  }

  private setFrontmatterCSS(markdownViewEl: HTMLElement, isHidden: boolean) {
    markdownViewEl.classList.toggle('gh-frontmatter-hidden', isHidden);
  }

  private removeLeafButtons(leaf: FrontmatterLeaf) {
    leaf.view.containerEl
      .querySelectorAll('.gh-frontmatter-visibility-toggle')
      .forEach((button) => button.remove());
  }

  private removeAll() {
    document
      .querySelectorAll('.gh-frontmatter-visibility-toggle')
      .forEach((button) => button.remove());
  }
}
