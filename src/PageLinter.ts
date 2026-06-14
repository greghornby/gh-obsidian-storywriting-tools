import {
  Plugin,
  TAbstractFile,
  TFile,
} from 'obsidian';
import type { GHStoryWritingToolsSettings } from './settings';
import { ContentParser } from './util/ContentParser';

export class PageLinter {
  private ignoredNextModify = new Set<string>();

  constructor(
    private plugin: Plugin,
    private settings: GHStoryWritingToolsSettings,
    private shouldLintFile: (file: TFile) => boolean,
  ) {}

  register() {
    this.plugin.registerEvent(
      this.plugin.app.vault.on('modify', (file) => {
        this.lintFile(file);
      }),
    );
  }

  unregister() {
    this.ignoredNextModify.clear();
  }

  private async lintFile(file: TAbstractFile) {
    if (!(file instanceof TFile)) {
      return;
    }

    if (this.ignoredNextModify.has(file.path)) {
      this.ignoredNextModify.delete(file.path);
      return;
    }

    if (file.extension !== 'md') {
      return;
    }

    if (!this.shouldLintFile(file)) {
      return;
    }

    const content = await this.plugin.app.vault.read(file);
    const {changed, normalizedFile} = this.normalizeFile(content);

    if (!changed) {
      return;
    }

    this.ignoredNextModify.add(file.path);
    await this.plugin.app.vault.modify(file, normalizedFile);
  }

  private normalizeFile(content: string): {changed: boolean; normalizedFile: string} {
    const {frontmatter, body} = ContentParser.parseContentToBodyAndFrontmatter(content);
    const {changed, normalizedBody} = this.normalizeBody(body);

    const normalizedFile = ContentParser.createContentFromBodyAndFrontmatter({body: normalizedBody, frontmatter});
    return {changed, normalizedFile};
  }

  private normalizeBody(body: string): {changed: boolean; normalizedBody: string} {
    let normalizedBody = body;
    let changed = false;

    if (this.settings.enforceBlankLinesBetweenParagraphs) {
      const singleNewLineReg = /([^\n])(\n)([^\n])/g;
      if (singleNewLineReg.test(normalizedBody)) {
        normalizedBody = normalizedBody.replace(singleNewLineReg, '$1\n\n$3');
        changed = true;
      }
    }

    if (this.settings.collapseExcessBlankLinesToOne) {
      const moreThanTwoNewLinesReg = /\n{3,}/g;
      if (moreThanTwoNewLinesReg.test(normalizedBody)) {
        normalizedBody = normalizedBody.replace(moreThanTwoNewLinesReg, '\n\n');
        changed = true;
      }
    }

    return {changed, normalizedBody};
  }
}
