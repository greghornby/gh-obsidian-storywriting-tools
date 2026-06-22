import { EventRef, TAbstractFile, TFile } from 'obsidian';
import { PageController } from './PageController';
import { StoryWritingToolsPlugin } from './StoryWritingToolsPlugin';
import { ContentParser } from './util/ContentParser';

export class PageLinter {
  public static filepathLintQueue = new Set<string>();
  private modifyEventRef?: EventRef;

  constructor(
    public plugin: StoryWritingToolsPlugin,
    public controller: PageController
  ) {}

  register() {
    this.modifyEventRef = this.plugin.app.vault.on('modify', (file) => {
      if (this.controller.target.mode !== "edit") {
        return;
      }
      PageLinterQueue.addFileToQueue(file, () => this.lintFile(file));
    });
  }

  unregister() {
    if (this.modifyEventRef) {
      this.plugin.app.vault.offref(this.modifyEventRef);
    }
  }

  get tools() {
    return this.controller.tools;
  }

  private async lintFile(file: TAbstractFile) {
    if (!this.plugin.settings.enableStoryLinter) {
      return;
    }
    if (file.path !== this.controller.filePath) {
      return;
    }
    if (!(file instanceof TFile)) {
      return;
    }

    if (file.extension !== 'md') {
      return;
    }

    console.log("Linting file", this.controller.filePath);

    const content = await this.plugin.app.vault.read(file);
    const {changed, normalizedFile} = this.normalizeFile(content);

    if (!changed) {
      return;
    }

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

    if (this.plugin.settings.enforceBlankLinesBetweenParagraphs) {
      const singleNewLineReg = /([^\n])(\n)([^\n])/g;
      if (singleNewLineReg.test(normalizedBody)) {
        normalizedBody = normalizedBody.replace(singleNewLineReg, '$1\n\n$3');
        changed = true;
      }
    }

    if (this.plugin.settings.collapseExcessBlankLinesToOne) {
      const moreThanTwoNewLinesReg = /\n{3,}/g;
      if (moreThanTwoNewLinesReg.test(normalizedBody)) {
        normalizedBody = normalizedBody.replace(moreThanTwoNewLinesReg, '\n\n');
        changed = true;
      }
    }

    return {changed, normalizedBody};
  }
}

class PageLinterQueue {
  private static LINT_DELAY_MS = 1000;
  public static filePaths = new Set<string>();
  public static filePathToLintFn = new Map<string, () => void>;
  public static ignoreNextModifyFilepaths = new Set<string>();
  private static lockId: number = 0;
  private static isLocked: boolean = false;

  public static addFileToQueue(file: TAbstractFile, fn: () => void) {
    if (this.isLocked) {
      console.log("addFileToQueue: ignored file because locked");
      return;
    }
    const filepath = file.path;
    if (this.filePaths.has(filepath)) {
      console.log("addFileToQueue: ignored file because already queued");
      return;
    }
    this.filePaths.add(filepath);
    this.filePathToLintFn.set(filepath, fn);
    this.lockId++;
    const cachedLockId = this.lockId;
    console.log("addFileToQueue: added file to queue. lock id:", cachedLockId);
    setTimeout(() => {
      console.log("Running setimeout");
      if (this.lockId !== cachedLockId) {
        console.log("Not running this timeout because cachedLockId", cachedLockId, "does not match current lockId", this.lockId);
        return;
      }
      console.log("Locking lint queue");
      this.isLocked = true;
      try {
        [...this.filePathToLintFn.values()].forEach(fn => fn());
      } finally {
        this.filePaths.clear();
        this.filePathToLintFn.clear();
        setTimeout(() => {
          this.isLocked = false;
          console.log("Unlocking lint queue");
        }, 1000);
      }
    }, this.LINT_DELAY_MS);
  }
}