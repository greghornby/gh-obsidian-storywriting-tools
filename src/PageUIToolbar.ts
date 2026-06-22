import type { PageController } from './PageController';
import { PageTarget } from './PageTarget';
import { PageUIPinnedButtons } from './PageUIPinnedButtons';
import { StoryWritingToolsPlugin } from './StoryWritingToolsPlugin';

export type PageUIToolbarMenu = 'pinned' | 'toolbar';
export type PageUIToolbarTarget = PageTarget;

export type PageUIToolbarItem = {
  id: string;
  mode?: "edit" | "preview" | "any"; //default "any"
  menu: PageUIToolbarMenu;
  create: (target: PageTarget) => HTMLElement;
  update?: (element: HTMLElement, target: PageTarget) => void;
  remove?: (element: HTMLElement, target: PageTarget) => void;
};

export class PageUIToolbar {
  private items = new Map<string, PageUIToolbarItem>();
  private isPinnedCollapsed = false;
  private pinnedStoryButtons: PageUIPinnedButtons;

  constructor(
    public plugin: StoryWritingToolsPlugin,
    public controller: PageController,
  ) {
    this.pinnedStoryButtons = new PageUIPinnedButtons(
      this.plugin,
      controller,
      this,
    );
  }

  register() {
    this.pinnedStoryButtons.register();
    this.render();
  }

  unregister() {
    this.pinnedStoryButtons.unregister();
    this.removeAll();
    this.items.clear();
  }

  get target() {
    return this.controller.target;
  }

  addItem(item: PageUIToolbarItem) {
    const forMode = item.mode ?? "any";
    if (forMode !== "any" && forMode !== this.controller.mode) {
      return;
    }
    this.items.set(item.id, item);
    this.render();
  }

  removeItem(itemId: string) {
    this.items.delete(itemId);

    this.target.el
      .querySelectorAll<HTMLElement>(`.gh-story-hud-row[data-story-hud-item-id="${itemId}"]`)
      .forEach((row) => row.remove());
  }

  render() {
    this.getOrCreateToolbar();
    this.syncPinnedNotch();

    for (const item of this.items.values()) {
      const itemsEl = this.getOrCreateMenuItemsEl(item.menu);
      const element = this.getOrCreateItemElement(itemsEl, item);

      item.update?.(element, this.target);
    }
  }

  private getOrCreateItemElement(
    itemsEl: HTMLElement,
    item: PageUIToolbarItem,
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
    const element = item.create(this.target);

    row.className = 'gh-story-hud-row';
    row.dataset.storyHudItemId = item.id;
    row.appendChild(element);
    itemsEl.appendChild(row);
    return element;
  }

  private getOrCreateToolbar() {
    this.target.el.classList.add('gh-story-hud-host');

    const existingToolbar = this.target.el.querySelector<HTMLElement>(
      ':scope > .gh-story-hud-toolbar',
    );

    if (existingToolbar) {
      return existingToolbar;
    }

    const toolbar = document.createElement('div');

    toolbar.className = 'gh-story-hud-toolbar';
    this.target.el.appendChild(toolbar);
    this.getOrCreateMenuItemsEl('toolbar');
    return toolbar;
  }

  private getOrCreatePinnedMenu() {
    this.target.el.classList.add('gh-story-hud-host');

    const existingPinnedMenu = this.target.el.querySelector<HTMLElement>(
      ':scope > .gh-story-hud-pinned',
    );

    if (existingPinnedMenu) {
      return existingPinnedMenu;
    }

    const pinnedMenu = document.createElement('div');

    pinnedMenu.className = 'gh-story-hud-pinned';
    this.target.el.appendChild(pinnedMenu);
    this.getOrCreateMenuItemsEl('pinned');
    return pinnedMenu;
  }

  private getOrCreateMenuItemsEl(menu: PageUIToolbarMenu) {
    const container = menu === 'toolbar'
      ? this.getOrCreateToolbar()
      : this.getOrCreatePinnedMenu();

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

  private getOrCreatePinnedNotch() {
    const toolbar = this.getOrCreateToolbar();
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
    this.syncPinnedNotch();
    return notch;
  }

  private togglePinnedCollapsed() {
    this.isPinnedCollapsed = !this.isPinnedCollapsed;
    this.controller.render();
  }

  private syncPinnedNotch() {
    const pinnedMenu = this.getOrCreatePinnedMenu();

    pinnedMenu.classList.toggle('is-collapsed', this.isPinnedCollapsed);

    const notch = this.getOrCreatePinnedNotch();

    notch.textContent = this.isPinnedCollapsed ? '↓' : '↑';
    notch.setAttribute('aria-label', this.isPinnedCollapsed ? 'Expand pinned menu' : 'Collapse pinned menu');
    notch.setAttribute('aria-expanded', String(!this.isPinnedCollapsed));
  }

  private removeAll() {
    for (const row of Array.from(this.target.el.querySelectorAll<HTMLElement>('.gh-story-hud-row'))) {
      const itemId = row.dataset.storyHudItemId;
      const element = row.firstElementChild;
      const item = itemId ? this.items.get(itemId) : null;

      if (element instanceof HTMLElement) {
        item?.remove?.(element, this.target);
      }
    }

    this.target.el
      .querySelectorAll('.gh-story-hud-toolbar, .gh-story-hud-pinned')
      .forEach((menu) => menu.remove());
  }
}
