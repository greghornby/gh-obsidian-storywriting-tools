import {
  MarkdownView,
  Plugin,
  WorkspaceLeaf,
} from 'obsidian';
import picomatch from 'picomatch';

type GlobMatcher = ReturnType<typeof picomatch>;
type PinnedMenuLeaf = Omit<WorkspaceLeaf, 'view'> & {view: MarkdownView};

export type PinnedMenuTarget = {
  el: HTMLElement;
  filePath: string;
  leaf: PinnedMenuLeaf;
  markdownView: MarkdownView;
};

export type PinnedMenuItem = {
  id: string;
  create: (target: PinnedMenuTarget) => HTMLElement;
  update?: (element: HTMLElement, target: PinnedMenuTarget) => void;
  remove?: (element: HTMLElement, target: PinnedMenuTarget) => void;
};

const isPinnedMenuLeaf = (leaf: WorkspaceLeaf): leaf is PinnedMenuLeaf => leaf.view instanceof MarkdownView;

export class PinnedMenu {
  private includeGlob = '';
  private includeMatcher: GlobMatcher | null = null;
  private items = new Map<string, PinnedMenuItem>();
  private isCollapsed = false;

  constructor(
    private plugin: Plugin,
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
      console.error('Invalid PinnedMenu include glob:', includeGlob, error);
      this.includeMatcher = null;
    }
  }

  addItem(item: PinnedMenuItem) {
    this.items.set(item.id, item);
    this.sync();
  }

  removeItem(itemId: string) {
    this.items.delete(itemId);

    document
      .querySelectorAll<HTMLElement>(`.gh-pinned-menu-row[data-pinned-menu-item-id="${itemId}"]`)
      .forEach((row) => row.remove());

    this.removeEmptyMenus();
  }

  refresh() {
    this.sync();
  }

  private sync() {
    const leaves = this.plugin.app.workspace.getLeavesOfType('markdown')
      .filter((leaf) => isPinnedMenuLeaf(leaf)) as PinnedMenuLeaf[];

    for (const leaf of leaves) {
      const targets = this.getLeafTargets(leaf);

      if (targets.length === 0) {
        this.removeLeafMenus(leaf);
        continue;
      }

      for (const target of targets) {
        this.syncTarget(target);
      }
    }
  }

  private syncTarget(target: PinnedMenuTarget) {
    if (!this.shouldInclude(target.filePath) || this.items.size === 0) {
      this.removeTargetMenu(target);
      return;
    }

    const menu = this.getOrCreateMenu(target.el);

    const rowsEl = this.getOrCreateRowsEl(menu);

    for (const item of this.items.values()) {
      const element = this.getOrCreateItemElement(rowsEl, item, target);
      item.update?.(element, target);
    }

    this.syncNotch(menu);
  }

  private getOrCreateItemElement(
    rowsEl: HTMLElement,
    item: PinnedMenuItem,
    target: PinnedMenuTarget,
  ) {
    const existingRow = Array.from(rowsEl.children)
      .find((child) => child instanceof HTMLElement && child.dataset.pinnedMenuItemId === item.id);

    if (existingRow instanceof HTMLElement) {
      const existingElement = existingRow.firstElementChild;

      if (existingElement instanceof HTMLElement) {
        return existingElement;
      }

      existingRow.remove();
    }

    const row = document.createElement('div');
    const element = item.create(target);

    row.className = 'gh-pinned-menu-row';
    row.dataset.pinnedMenuItemId = item.id;
    row.appendChild(element);
    rowsEl.appendChild(row);
    return element;
  }

  private getLeafTargets(leaf: PinnedMenuLeaf): PinnedMenuTarget[] {
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

  private getOrCreateMenu(hostEl: HTMLElement) {
    hostEl.classList.add('gh-pinned-menu-host');

    const existingMenu = hostEl.querySelector<HTMLElement>(
      ':scope > .gh-pinned-menu',
    );

    if (existingMenu) {
      return existingMenu;
    }

    const menu = document.createElement('div');

    menu.className = 'gh-pinned-menu';
    hostEl.appendChild(menu);
    this.getOrCreateRowsEl(menu);
    this.getOrCreateNotch(menu);
    return menu;
  }

  private getOrCreateRowsEl(menu: HTMLElement) {
    const existingRowsEl = menu.querySelector<HTMLElement>(
      ':scope > .gh-pinned-menu-rows',
    );

    if (existingRowsEl) {
      return existingRowsEl;
    }

    const rowsEl = document.createElement('div');

    rowsEl.className = 'gh-pinned-menu-rows';
    menu.appendChild(rowsEl);
    return rowsEl;
  }

  private getOrCreateNotch(menu: HTMLElement) {
    const existingNotch = menu.querySelector<HTMLButtonElement>(
      ':scope > .gh-pinned-menu-notch',
    );

    if (existingNotch) {
      return existingNotch;
    }

    const notch = document.createElement('button');

    notch.type = 'button';
    notch.className = 'gh-pinned-menu-notch';
    notch.addEventListener('click', () => {
      this.toggleCollapsed();
    });

    menu.appendChild(notch);
    this.syncNotch(menu);
    return notch;
  }

  private toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
    this.sync();
  }

  private syncNotch(menu: HTMLElement) {
    menu.classList.toggle('is-collapsed', this.isCollapsed);

    const notch = this.getOrCreateNotch(menu);

    notch.textContent = this.isCollapsed ? '>' : '<';
    notch.setAttribute('aria-label', this.isCollapsed ? 'Expand pinned menu' : 'Collapse pinned menu');
    notch.setAttribute('aria-expanded', String(!this.isCollapsed));
  }

  private removeTargetMenu(target: PinnedMenuTarget) {
    const menu = target.el.querySelector<HTMLElement>(':scope > .gh-pinned-menu');
    if (!menu) {
      return;
    }

    const rowsEl = menu.querySelector<HTMLElement>(':scope > .gh-pinned-menu-rows');
    if (!rowsEl) {
      menu.remove();
      return;
    }

    for (const row of Array.from(rowsEl.children)) {
      if (!(row instanceof HTMLElement)) {
        continue;
      }

      const itemId = row.dataset.pinnedMenuItemId;
      const element = row.firstElementChild;
      const item = itemId ? this.items.get(itemId) : null;

      if (element instanceof HTMLElement) {
        item?.remove?.(element, target);
      }
    }

    menu.remove();
  }

  private removeLeafMenus(leaf: PinnedMenuLeaf) {
    leaf.view.containerEl
      .querySelectorAll<HTMLElement>('.gh-pinned-menu')
      .forEach((menu) => menu.remove());
  }

  private removeAll() {
    document
      .querySelectorAll('.gh-pinned-menu')
      .forEach((menu) => menu.remove());
  }

  private removeEmptyMenus() {
    document
      .querySelectorAll<HTMLElement>('.gh-pinned-menu')
      .forEach((menu) => {
        const rowsEl = menu.querySelector<HTMLElement>(':scope > .gh-pinned-menu-rows');
        if (!rowsEl || rowsEl.children.length === 0) {
          menu.remove();
        }
      });
  }
}
