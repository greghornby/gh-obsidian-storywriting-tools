import {
  MarkdownView,
  Plugin,
  WorkspaceLeaf,
} from 'obsidian';
import picomatch from 'picomatch';

type GlobMatcher = ReturnType<typeof picomatch>;
type StoryHUDLeaf = Omit<WorkspaceLeaf, 'view'> & {view: MarkdownView};

export type StoryHUDMenu = 'pinned' | 'toolbar';

export type StoryHUDTarget = {
  el: HTMLElement;
  filePath: string;
  leaf: StoryHUDLeaf;
  markdownView: MarkdownView;
};

export type StoryHUDItem = {
  id: string;
  menu: StoryHUDMenu;
  create: (target: StoryHUDTarget) => HTMLElement;
  update?: (element: HTMLElement, target: StoryHUDTarget) => void;
  remove?: (element: HTMLElement, target: StoryHUDTarget) => void;
};

const isStoryHUDLeaf = (leaf: WorkspaceLeaf): leaf is StoryHUDLeaf => leaf.view instanceof MarkdownView;

export class StoryHUD {
  private includeGlob = '';
  private includeMatcher: GlobMatcher | null = null;
  private items = new Map<string, StoryHUDItem>();
  private isPinnedCollapsed = false;

  constructor(
    readonly plugin: Plugin,
    includeGlob: string,
  ) {
    this.setIncludeGlob(includeGlob);
  }

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
    this.items.clear();
  }

  setIncludeGlob(includeGlob: string) {
    this.includeGlob = includeGlob;

    try {
      this.includeMatcher = picomatch(includeGlob);
    } catch (error) {
      console.error('Invalid StoryHUD include glob:', includeGlob, error);
      this.includeMatcher = null;
    }
  }

  addItem(item: StoryHUDItem) {
    this.items.set(item.id, item);
    this.sync();
  }

  removeItem(itemId: string) {
    this.items.delete(itemId);

    document
      .querySelectorAll<HTMLElement>(`.gh-story-hud-row[data-story-hud-item-id="${itemId}"]`)
      .forEach((row) => row.remove());

    this.removeEmptyHUDs();
  }

  refresh() {
    this.sync();
  }

  getTargets() {
    return this.getAllTargets()
      .filter((target) => this.shouldInclude(target.filePath));
  }

  private sync() {
    const targets = this.getAllTargets();
    const targetEls = new Set(targets.map((target) => target.el));

    document
      .querySelectorAll<HTMLElement>('.gh-story-hud-toolbar, .gh-story-hud-pinned')
      .forEach((menu) => {
        const hostEl = menu.parentElement;
        if (!hostEl || !targetEls.has(hostEl)) {
          menu.remove();
        }
      });

    for (const target of targets) {
      if (!this.shouldInclude(target.filePath)) {
        this.removeTargetHUD(target);
        continue;
      }

      this.syncTarget(target);
    }
  }

  private syncTarget(target: StoryHUDTarget) {
    this.getOrCreateToolbar(target.el);
    this.syncPinnedNotch(target.el);

    for (const item of this.items.values()) {
      const itemsEl = this.getOrCreateMenuItemsEl(target.el, item.menu);
      const element = this.getOrCreateItemElement(itemsEl, item, target);
      item.update?.(element, target);
    }
  }

  private getOrCreateItemElement(
    itemsEl: HTMLElement,
    item: StoryHUDItem,
    target: StoryHUDTarget,
  ) {
    const existingRow = Array.from(itemsEl.children)
      .find((child) => child instanceof HTMLElement && child.dataset.storyHudItemId === item.id);

    if (existingRow instanceof HTMLElement) {
      const existingElement = existingRow.firstElementChild;

      if (existingElement instanceof HTMLElement) {
        return existingElement;
      }

      existingRow.remove();
    }

    const row = document.createElement('div');
    const element = item.create(target);

    row.className = 'gh-story-hud-row';
    row.dataset.storyHudItemId = item.id;
    row.appendChild(element);
    itemsEl.appendChild(row);
    return element;
  }

  private getAllTargets() {
    const leaves = this.plugin.app.workspace.getLeavesOfType('markdown')
      .filter((leaf) => isStoryHUDLeaf(leaf)) as StoryHUDLeaf[];

    return leaves.flatMap((leaf) => this.getLeafTargets(leaf));
  }

  private getLeafTargets(leaf: StoryHUDLeaf): StoryHUDTarget[] {
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
      leaf,
      markdownView: leaf.view,
    }));
  }

  private shouldInclude(filePath: string) {
    if (!this.includeMatcher) {
      return false;
    }

    return this.includeMatcher(filePath);
  }

  private getOrCreateToolbar(hostEl: HTMLElement) {
    hostEl.classList.add('gh-story-hud-host');

    const existingToolbar = hostEl.querySelector<HTMLElement>(
      ':scope > .gh-story-hud-toolbar',
    );

    if (existingToolbar) {
      return existingToolbar;
    }

    const toolbar = document.createElement('div');

    toolbar.className = 'gh-story-hud-toolbar';
    hostEl.appendChild(toolbar);
    this.getOrCreateMenuItemsEl(hostEl, 'toolbar');
    return toolbar;
  }

  private getOrCreatePinnedMenu(hostEl: HTMLElement) {
    hostEl.classList.add('gh-story-hud-host');

    const existingPinnedMenu = hostEl.querySelector<HTMLElement>(
      ':scope > .gh-story-hud-pinned',
    );

    if (existingPinnedMenu) {
      return existingPinnedMenu;
    }

    const pinnedMenu = document.createElement('div');

    pinnedMenu.className = 'gh-story-hud-pinned';
    hostEl.appendChild(pinnedMenu);
    this.getOrCreateMenuItemsEl(hostEl, 'pinned');
    return pinnedMenu;
  }

  private getOrCreateMenuItemsEl(hostEl: HTMLElement, menu: StoryHUDMenu) {
    const container = menu === 'toolbar'
      ? this.getOrCreateToolbar(hostEl)
      : this.getOrCreatePinnedMenu(hostEl);

    const className = menu === 'toolbar'
      ? 'gh-story-hud-toolbar-items'
      : 'gh-story-hud-pinned-items';

    const existingItemsEl = container.querySelector<HTMLElement>(
      `:scope > .${className}`,
    );

    if (existingItemsEl) {
      return existingItemsEl;
    }

    const itemsEl = document.createElement('div');

    itemsEl.className = className;
    container.appendChild(itemsEl);
    return itemsEl;
  }

  private getOrCreatePinnedNotch(hostEl: HTMLElement) {
    const toolbar = this.getOrCreateToolbar(hostEl);
    const existingNotch = toolbar.querySelector<HTMLButtonElement>(
      ':scope > .gh-story-hud-pinned-notch',
    );

    if (existingNotch) {
      return existingNotch;
    }

    const notch = document.createElement('button');

    notch.type = 'button';
    notch.className = 'gh-story-hud-pinned-notch';
    notch.addEventListener('click', () => {
      this.togglePinnedCollapsed();
    });

    toolbar.prepend(notch);
    this.syncPinnedNotch(hostEl);
    return notch;
  }

  private togglePinnedCollapsed() {
    this.isPinnedCollapsed = !this.isPinnedCollapsed;
    this.sync();
  }

  private syncPinnedNotch(hostEl: HTMLElement) {
    const pinnedMenu = this.getOrCreatePinnedMenu(hostEl);

    pinnedMenu.classList.toggle('is-collapsed', this.isPinnedCollapsed);

    const notch = this.getOrCreatePinnedNotch(hostEl);

    notch.textContent = this.isPinnedCollapsed ? '↓' : '↑';
    notch.setAttribute('aria-label', this.isPinnedCollapsed ? 'Expand pinned menu' : 'Collapse pinned menu');
    notch.setAttribute('aria-expanded', String(!this.isPinnedCollapsed));
  }

  private removeTargetHUD(target: StoryHUDTarget) {
    this.removeTargetMenu(target, 'toolbar');
    this.removeTargetMenu(target, 'pinned');
  }

  private removeTargetMenu(target: StoryHUDTarget, menu: StoryHUDMenu) {
    const selector = menu === 'toolbar'
      ? ':scope > .gh-story-hud-toolbar'
      : ':scope > .gh-story-hud-pinned';

    const menuEl = target.el.querySelector<HTMLElement>(selector);
    if (!menuEl) {
      return;
    }

    for (const row of Array.from(menuEl.querySelectorAll<HTMLElement>('.gh-story-hud-row'))) {
      const itemId = row.dataset.storyHudItemId;
      const element = row.firstElementChild;
      const item = itemId ? this.items.get(itemId) : null;

      if (element instanceof HTMLElement) {
        item?.remove?.(element, target);
      }
    }

    menuEl.remove();
  }

  private removeAll() {
    document
      .querySelectorAll('.gh-story-hud-toolbar, .gh-story-hud-pinned')
      .forEach((menu) => menu.remove());
  }

  private removeEmptyHUDs() {
    this.sync();
  }
}
