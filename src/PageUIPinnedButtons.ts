import { PageController } from './PageController';
import {
  PageUIToolbar,
  PageUIToolbarTarget,
} from './PageUIToolbar';
import { StoryWritingToolsPlugin } from './StoryWritingToolsPlugin';

export class PageUIPinnedButtons {
  private toggleMetadataButton: ToggleMetadataButton;
  private sceneBreakButton: SceneBreakButton;
  private emDashButton: EmDashButton;

  constructor(
    public plugin: StoryWritingToolsPlugin,
    private controller: PageController,
    private toolbar: PageUIToolbar,
  ) {
    this.toggleMetadataButton = new ToggleMetadataButton(this.controller);
    this.sceneBreakButton = new SceneBreakButton(this.controller);
    this.emDashButton = new EmDashButton(this.controller);
  }

  register() {
    this.toolbar.addItem({
      id: ToggleMetadataButton.toggleMetadataItemId,
      menu: 'pinned',
      create: () => this.toggleMetadataButton.createToggleMetadataButton(),
      update: (element, target) => {
        this.toggleMetadataButton.updateToggleMetadataButton(element, target);
      },
    });

    this.toolbar.addItem({
      id: SceneBreakButton.sceneBreakItemId,
      menu: 'pinned',
      create: () => this.sceneBreakButton.createSceneBreakButton(),
      update: (element, target) => {
        this.sceneBreakButton.updateSceneBreakButton(element, target);
      },
    });

    this.toolbar.addItem({
      id: EmDashButton.emDashItemId,
      menu: 'pinned',
      create: () => this.emDashButton.createEmDashButton(),
      update: (element, target) => {
        this.emDashButton.updateEmDashButton(element, target);
      },
    });
  }

  unregister() {
    this.toolbar.removeItem(ToggleMetadataButton.toggleMetadataItemId);
    this.toolbar.removeItem(SceneBreakButton.sceneBreakItemId);
    this.toolbar.removeItem(EmDashButton.emDashItemId);
  }
}

class ToggleMetadataButton {
  static toggleMetadataItemId = 'toggle-metadata';

  constructor(private controller: PageController) {}

  createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
    return button;
  }

  updateToggleMetadataButton(element: HTMLElement, _target: PageUIToolbarTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    const isVisible = this.controller.tools.isMetadataVisible();

    element.textContent = isVisible ? 'Hide Metadata' : 'Show Metadata';
    element.setAttribute('aria-pressed', String(isVisible));
    element.onclick = () => {
      this.controller.tools.toggleMetadataVisibility();
    };
  }
}

class SceneBreakButton {
  static sceneBreakItemId = 'scene-break';

  constructor(private controller: PageController) {}

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
      this.controller.tools.addOnNextLine('---', true);
    };
  }
}

class EmDashButton {
  static emDashItemId = 'em-dash';

  constructor(private controller: PageController) {}

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
      this.controller.tools.addAtCursor('—', true);
    };
  }
}
