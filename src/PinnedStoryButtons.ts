import {
  PinnedMenu,
  PinnedMenuTarget,
} from './PinnedMenu';

const toggleMetadataItemId = 'toggle-metadata';

export class PinnedStoryButtons {
  private filesWithFrontmatterHidden = new Set<string>();

  constructor(private pinnedMenu: PinnedMenu) {}

  register() {
    this.pinnedMenu.addItem({
      id: toggleMetadataItemId,
      create: () => this.createToggleMetadataButton(),
      update: (element, target) => {
        this.updateToggleMetadataButton(element, target);
      },
      remove: (_element, target) => {
        this.setFrontmatterCSS(target.el, false);
      },
    });
  }

  unregister() {
    this.pinnedMenu.removeItem(toggleMetadataItemId);
  }

  private createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'gh-frontmatter-visibility-toggle';
    return button;
  }

  private updateToggleMetadataButton(element: HTMLElement, target: PinnedMenuTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    const isHidden = this.filesWithFrontmatterHidden.has(target.filePath);

    element.textContent = isHidden ? 'Show Metadata' : 'Hide Metadata';
    element.setAttribute('aria-pressed', String(isHidden));
    element.onclick = () => {
      this.toggleFrontmatterVisibility(target.filePath);
    };

    this.setFrontmatterCSS(target.el, isHidden);
  }

  private toggleFrontmatterVisibility(filePath: string) {
    if (this.filesWithFrontmatterHidden.has(filePath)) {
      this.filesWithFrontmatterHidden.delete(filePath);
    } else {
      this.filesWithFrontmatterHidden.add(filePath);
    }

    this.pinnedMenu.refresh();
  }

  private setFrontmatterCSS(markdownViewEl: HTMLElement, isHidden: boolean) {
    markdownViewEl.classList.toggle('gh-frontmatter-hidden', isHidden);
  }
}
