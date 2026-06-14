import {
  MarkdownView,
  WorkspaceLeaf,
} from 'obsidian';

export type PageTargetLeaf = Omit<WorkspaceLeaf, 'view'> & {view: MarkdownView};

export type PageTarget = {
  mode: "edit" | "preview";
  containerEl: HTMLElement;
  el: HTMLElement;
  filePath: string;
  leaf: PageTargetLeaf;
  markdownView: MarkdownView;
};

export const isPageTargetLeaf = (leaf: WorkspaceLeaf): leaf is PageTargetLeaf => leaf.view instanceof MarkdownView;
