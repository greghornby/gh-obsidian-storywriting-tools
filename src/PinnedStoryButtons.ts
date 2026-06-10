import {
  PinnedMenu,
  PinnedMenuTarget,
} from './PinnedMenu';

export class PinnedStoryButtons {
  private toggleMetadataButton: ToggleMetadataButton;

  constructor(private pinnedMenu: PinnedMenu) {
    this.toggleMetadataButton = new ToggleMetadataButton(this.pinnedMenu);
  }

  register() {
    this.pinnedMenu.addItem({
      id: ToggleMetadataButton.toggleMetadataItemId,
      create: () => this.toggleMetadataButton.createToggleMetadataButton(),
      update: (element, target) => {
        this.toggleMetadataButton.updateToggleMetadataButton(element, target);
      },
      remove: (_element, target) => {
        this.toggleMetadataButton.setFrontmatterCSS(target.el, false);
      },
    });
  }

  unregister() {
    this.pinnedMenu.removeItem(ToggleMetadataButton.toggleMetadataItemId);
  }


}

class ToggleMetadataButton {

  static toggleMetadataItemId = 'toggle-metadata';

  constructor(private pinnedMenu: PinnedMenu) {}

  filesWithFrontmatterHidden = new Set<string>();

  createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'gh-frontmatter-visibility-toggle';
    return button;
  }

  updateToggleMetadataButton(element: HTMLElement, target: PinnedMenuTarget) {
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

  toggleFrontmatterVisibility(filePath: string) {
    if (this.filesWithFrontmatterHidden.has(filePath)) {
      this.filesWithFrontmatterHidden.delete(filePath);
    } else {
      this.filesWithFrontmatterHidden.add(filePath);
    }

    this.pinnedMenu.refresh();
  }

   setFrontmatterCSS(markdownViewEl: HTMLElement, isHidden: boolean) {
    markdownViewEl.classList.toggle('gh-frontmatter-hidden', isHidden);
  }
}
