import {
  StoryHUD,
  StoryHUDTarget,
} from './StoryHUD';
import { PageController } from './PageController';
import { State } from './State';

export class PinnedStoryButtons {
  private toggleMetadataButton: ToggleMetadataButton;
  private sceneBreakButton: SceneBreakButton;
  private emDashButton: EmDashButton;
  private sampleToolbarButton = new SampleToolbarButton();

  constructor(
    private storyHUD: StoryHUD,
    private state: State,
    private pageController: PageController,
  ) {
    this.toggleMetadataButton = new ToggleMetadataButton(
      this.storyHUD,
      this.state,
      this.pageController,
    );
    this.sceneBreakButton = new SceneBreakButton(this.pageController);
    this.emDashButton = new EmDashButton(this.pageController);
  }

  register() {
    this.storyHUD.addItem({
      id: ToggleMetadataButton.toggleMetadataItemId,
      menu: 'pinned',
      create: () => this.toggleMetadataButton.createToggleMetadataButton(),
      update: (element, target) => {
        this.toggleMetadataButton.updateToggleMetadataButton(element, target);
      },
    });

    this.storyHUD.addItem({
      id: SceneBreakButton.sceneBreakItemId,
      menu: 'pinned',
      create: () => this.sceneBreakButton.createSceneBreakButton(),
      update: (element, target) => {
        this.sceneBreakButton.updateSceneBreakButton(element, target);
      },
    });

    this.storyHUD.addItem({
      id: EmDashButton.emDashItemId,
      menu: 'pinned',
      create: () => this.emDashButton.createEmDashButton(),
      update: (element, target) => {
        this.emDashButton.updateEmDashButton(element, target);
      },
    });

    // this.storyHUD.addItem({
    //   id: SampleToolbarButton.sampleToolbarItemId,
    //   menu: 'toolbar',
    //   create: () => this.sampleToolbarButton.createSampleToolbarButton(),
    //   update: (element, target) => {
    //     this.sampleToolbarButton.updateSampleToolbarButton(element, target);
    //   },
    // });
  }

  unregister() {
    this.storyHUD.removeItem(ToggleMetadataButton.toggleMetadataItemId);
    this.storyHUD.removeItem(SceneBreakButton.sceneBreakItemId);
    this.storyHUD.removeItem(EmDashButton.emDashItemId);
    // this.storyHUD.removeItem(SampleToolbarButton.sampleToolbarItemId);
  }


}

class ToggleMetadataButton {

  static toggleMetadataItemId = 'toggle-metadata';

  constructor(
    private storyHUD: StoryHUD,
    private state: State,
    private pageController: PageController,
  ) {}

  createToggleMetadataButton() {
    const button = document.createElement('button');

    button.type = 'button';
    return button;
  }

  updateToggleMetadataButton(element: HTMLElement, target: StoryHUDTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    const isVisible = this.state.isMetadataVisible(target.filePath);

    element.textContent = isVisible ? 'Hide Metadata' : 'Show Metadata';
    element.setAttribute('aria-pressed', String(isVisible));
    element.onclick = () => {
      this.toggleFrontmatterVisibility(target.filePath);
    };
  }

  toggleFrontmatterVisibility(filePath: string) {
    this.state.toggleMetadataHidden(filePath);

    this.storyHUD.refresh();
    this.pageController.render();
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

  updateSceneBreakButton(element: HTMLElement, target: StoryHUDTarget) {
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

  updateEmDashButton(element: HTMLElement, target: StoryHUDTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      this.pageController.addAtCursor('—', true);
    };
  }
}

class SampleToolbarButton {
  static sampleToolbarItemId = 'sample-toolbar';

  createSampleToolbarButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Toolbar Sample';
    return button;
  }

  updateSampleToolbarButton(element: HTMLElement, target: StoryHUDTarget) {
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    element.onclick = () => {
      console.log('StoryHUD toolbar sample clicked:', target.filePath);
    };
  }
}
