import {
  Plugin,
  TFile,
} from 'obsidian';
import picomatch from 'picomatch';
import { PageController } from './PageController';
import {
  isPageTargetLeaf,
  PageTarget,
} from './PageTarget';
import {
  DEFAULT_SETTINGS,
  GHStoryWritingToolsSettings,
} from './settings';
import { State } from './State';
import { PageLinter } from './StoryLinter';
import { StoryWritingToolsSettingTab } from './StoryWritingToolsSettingTab';

type GlobMatcher = ReturnType<typeof picomatch>;

export class StoryWritingToolsPlugin extends Plugin {
  settings: GHStoryWritingToolsSettings = {...DEFAULT_SETTINGS};

  private state!: State;
  private storyLinter: PageLinter | null = null;
  private storyToolsMatcher: GlobMatcher | null = null;
  private pageControllers = new Map<HTMLElement, PageController>();

  async onload() {
    await this.loadSettings();

    this.state = new State(this);
    await this.state.load();
    this.compileStoryToolsMatcher();

    this.storyLinter = new PageLinter(
      this,
      this.settings,
      (file) => this.shouldRunStoryLinter(file),
    );

    this.addSettingTab(new StoryWritingToolsSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.syncPageControllers();
    });

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.syncPageControllers();
      }),
    );

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.syncPageControllers();
      }),
    );

    this.storyLinter.register();
  }

  onunload() {
    this.storyLinter?.unregister();
    this.unregisterPageControllers();
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
    this.compileStoryToolsMatcher();
    this.syncPageControllers();
  }

  renderControllersForFile(filePath: string) {
    for (const controller of this.pageControllers.values()) {
      if (controller.filePath === filePath) {
        controller.render();
      }
    }
  }

  private syncPageControllers() {
    const targets = this.getPageTargets();
    const activeTargets = targets.filter((target) => this.shouldActivateFilePath(target.filePath));
    const activeTargetEls = new Set(activeTargets.map((target) => target.el));

    this.removeStrayPageUI(activeTargetEls);

    for (const [el, controller] of this.pageControllers) {
      if (!activeTargetEls.has(el)) {
        controller.unregister();
        this.pageControllers.delete(el);
      }
    }

    for (const target of activeTargets) {
      const existingController = this.pageControllers.get(target.el);

      if (existingController) {
        existingController.setTarget(target);
        existingController.render();
        continue;
      }

      const controller = new PageController(
        target,
        this.state,
        (filePath) => this.renderControllersForFile(filePath),
      );

      this.pageControllers.set(target.el, controller);
      controller.register();
    }
  }

  private unregisterPageControllers() {
    for (const controller of this.pageControllers.values()) {
      controller.unregister();
    }

    this.pageControllers.clear();
  }

  private getPageTargets(): PageTarget[] {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .filter((leaf) => isPageTargetLeaf(leaf))
      .flatMap((leaf) => {
        const filePath = leaf.view.file?.path;

        if (!filePath) {
          return [];
        }

        const viewEls = leaf.view.containerEl.querySelectorAll<HTMLElement>(
          '.markdown-source-view, .markdown-preview-view',
        );

        return Array.from(viewEls).map<PageTarget>((el) => ({
          mode: el.classList.contains("markdown-source-view") ? "edit" : "preview",
          containerEl: leaf.view.containerEl,
          el,
          filePath,
          leaf,
          markdownView: leaf.view,
        }));
      });
  }

  private shouldRunStoryLinter(file: TFile) {
    return this.settings.enableStoryLinter && this.shouldActivateFilePath(file.path);
  }

  private shouldActivateFilePath(filePath: string) {
    if (!this.storyToolsMatcher) {
      return false;
    }

    return this.storyToolsMatcher(filePath);
  }

  private compileStoryToolsMatcher() {
    try {
      this.storyToolsMatcher = picomatch(this.settings.storyToolsGlob);
    } catch (error) {
      console.error('Invalid Story Tools glob:', this.settings.storyToolsGlob, error);
      this.storyToolsMatcher = null;
    }
  }

  private removeStrayPageUI(activeTargetEls: Set<HTMLElement>) {
    document
      .querySelectorAll<HTMLElement>('.gh-story-hud-toolbar, .gh-story-hud-pinned')
      .forEach((menu) => {
        const hostEl = menu.parentElement;

        if (!hostEl || !activeTargetEls.has(hostEl)) {
          menu.remove();
        }
      });
  }
}
