import type { PageController } from './PageController';
import {
  PageUIToolbar,
  PageUIToolbarTarget,
} from './PageUIToolbar';

export class PageUIPinnedButtons {
  private toggleMetadataButton: ToggleMetadataButton;
  private sceneBreakButton: SceneBreakButton;
  private emDashButton: EmDashButton;

  constructor(
    private pageUIToolbar: PageUIToolbar,
    private pageController: PageController,
  ) {
    this.toggleMetadataButton = new ToggleMetadataButton(this.pageController);
    this.sceneBreakButton = new SceneBreakButton(this.pageController);
    this.emDashButton = new EmDashButton(this.pageController);
  }

  register() {
    this.pageUIToolbar.addItem({
      id: ToggleMetadataButton.toggleMetadataItemId,
      menu: 'pinned',
      create: () => this.toggleMetadataButton.createToggleMetadataButton(),
      update: (element, target) => {
        this.toggleMetadataButton.updateToggleMetadataButton(element, target);
      },
    });

    this.pageUIToolbar.addItem({
      id: SceneBreakButton.sceneBreakItemId,
      menu: 'pinned',
      create: () => this.sceneBreakButton.createSceneBreakButton(),
      update: (element, target) => {
        this.sceneBreakButton.updateSceneBreakButton(element, target);
      },
    });

    this.pageUIToolbar.addItem({
      id: EmDashButton.emDashItemId,
      menu: 'pinned',
      create: () => this.emDashButton.createEmDashButton(),
      update: (element, target) => {
        this.emDashButton.updateEmDashButton(element, target);
      },
    });
  }

  unregister() {
    this.pageUIToolbar.removeItem(ToggleMetadataButton.toggleMetadataItemId);
    this.pageUIToolbar.removeItem(SceneBreakButton.sceneBreakItemId);
    this.pageUIToolbar.removeItem(EmDashButton.emDashItemId);
  }
}

class ToggleMetadataButton {
  static toggleMetadataItemId = 'toggle-metadata';

  constructor(private pageController: PageController) {}

  createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
    return button;
  }

  updateToggleMetadataButton(element: HTMLElement, _target: PageUIToolbarTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    const isVisible = this.pageController.isMetadataVisible();

    element.textContent = isVisible ? 'Hide Metadata' : 'Show Metadata';
    element.setAttribute('aria-pressed', String(isVisible));
    element.onclick = () => {
      this.pageController.toggleMetadataVisibility();
    };
  }
}

class SceneBreakButton {
  static sceneBreakItemId = 'scene-break';

  constructor(private pageController: PageController) {}

  createSceneBreakButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Scene Break';
    return button;
  }

  updateSceneBreakButton(element: HTMLElement, _target: PageUIToolbarTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      this.pageController.addOnNextLine('---', true);
    };
  }
}

class EmDashButton {
  static emDashItemId = 'em-dash';

  constructor(private pageController: PageController) {}

  createEmDashButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Emdash';
    return button;
  }

  updateEmDashButton(element: HTMLElement, _target: PageUIToolbarTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      this.pageController.addAtCursor('—', true);
    };
  }
}
