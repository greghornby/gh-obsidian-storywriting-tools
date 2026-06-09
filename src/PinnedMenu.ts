import { Plugin } from 'obsidian';

export class PinnedMenu {
  constructor(private plugin: Plugin) {}

  register() {}

  unregister() {
    this.removeAll();
  }

  addElement(hostEl: HTMLElement, element: HTMLElement) {
    const menu = this.getOrCreateMenu(hostEl);
    const row = document.createElement('div');

    row.className = 'gh-pinned-menu-row';
    row.appendChild(element);
    menu.appendChild(row);
  }

  removeElement(element: Element) {
    const row = element.closest('.gh-pinned-menu-row');

    if (row) {
      row.remove();
    } else {
      element.remove();
    }

    this.removeEmptyMenus();
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
    return menu;
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
        if (menu.children.length === 0) {
          menu.remove();
        }
      });
  }
}
