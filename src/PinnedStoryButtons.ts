import {
  PinnedMenu,
  PinnedMenuTarget,
} from './PinnedMenu';

export class PinnedStoryButtons {
  private toggleMetadataButton: ToggleMetadataButton;
  private sceneBreakButton = new SceneBreakButton();
  private emDashButton = new EmDashButton();

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

    this.pinnedMenu.addItem({
      id: SceneBreakButton.sceneBreakItemId,
      create: () => this.sceneBreakButton.createSceneBreakButton(),
      update: (element, target) => {
        this.sceneBreakButton.updateSceneBreakButton(element, target);
      },
    });

    this.pinnedMenu.addItem({
      id: EmDashButton.emDashItemId,
      create: () => this.emDashButton.createEmDashButton(),
      update: (element, target) => {
        this.emDashButton.updateEmDashButton(element, target);
      },
    });
  }

  unregister() {
    this.pinnedMenu.removeItem(ToggleMetadataButton.toggleMetadataItemId);
    this.pinnedMenu.removeItem(SceneBreakButton.sceneBreakItemId);
    this.pinnedMenu.removeItem(EmDashButton.emDashItemId);
  }


}

class ToggleMetadataButton {

  static toggleMetadataItemId = 'toggle-metadata';

  constructor(private pinnedMenu: PinnedMenu) {}

  filesWithFrontmatterHidden = new Set<string>();

  createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
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

class SceneBreakButton {
  static sceneBreakItemId = 'scene-break';

  createSceneBreakButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Scene Break';
    return button;
  }

  updateSceneBreakButton(element: HTMLElement, target: PinnedMenuTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      this.insertSceneBreak(target);
    };
  }

  private insertSceneBreak(target: PinnedMenuTarget) {
    const editor = target.markdownView.editor;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);

    if (line.trim().length === 0) {
      editor.replaceRange('---\n', {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
      editor.setCursor({line: cursor.line + 1, ch: 0});
      return;
    }

    editor.replaceRange('\n---\n', {line: cursor.line, ch: line.length});
    editor.setCursor({line: cursor.line + 2, ch: 0});
  }
}

class EmDashButton {
  static emDashItemId = 'em-dash';

  createEmDashButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Emdash';
    return button;
  }

  updateEmDashButton(element: HTMLElement, target: PinnedMenuTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      this.insertEmDash(target);
    };
  }

  private insertEmDash(target: PinnedMenuTarget) {
    const editor = target.markdownView.editor;
    const cursor = editor.getCursor();

    editor.replaceRange('—', cursor);
    editor.setCursor({
      line: cursor.line,
      ch: cursor.ch + 1,
    });
  }
}
