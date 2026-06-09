import {
  Plugin,
  TAbstractFile,
  TFile,
} from 'obsidian';
import picomatch from 'picomatch';

type GlobMatcher = ReturnType<typeof picomatch>;

export class StoryLinter {
  private ignoredNextModify = new Set<string>();
  private includeGlob = '';
  private includeMatcher: GlobMatcher | null = null;

  constructor(
    private plugin: Plugin,
    includeGlob: string,
  ) {
    this.setIncludeGlob(includeGlob);
  }

  setIncludeGlob(includeGlob: string) {
    this.includeGlob = includeGlob;

    try {
      this.includeMatcher = picomatch(includeGlob);
    } catch (error) {
      console.error('Invalid StoryLinter include glob:', includeGlob, error);
      this.includeMatcher = null;
    }
  }

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
    const normalizedContent = this.normalizeNewlinePairs(content);

    if (normalizedContent === content) {
      return;
    }

    this.ignoredNextModify.add(file.path);
    await this.plugin.app.vault.modify(file, normalizedContent);
  }

  private shouldLintFile(file: TFile) {
    if (!this.includeMatcher) {
      return false;
    }

    return this.includeMatcher(file.path);
  }

  private normalizeNewlinePairs(content: string) {
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const normalizedLineEndings = content.replace(/\r\n|\r/g, '\n');
    const bodyStart = this.getBodyStart(normalizedLineEndings);
    const frontmatter = normalizedLineEndings.slice(0, bodyStart);
    const body = normalizedLineEndings.slice(bodyStart);
    const normalizedBody = body.replace(/\n+/g, (newlines) => {
      if (newlines.length % 2 === 0) {
        return newlines;
      }

      return `${newlines}\n`;
    });

    return `${frontmatter}${normalizedBody}`.replace(/\n/g, lineEnding);
  }

  private getBodyStart(content: string) {
    if (!content.startsWith('---\n')) {
      return 0;
    }

    const frontmatterEnd = content.match(/^---\n[\s\S]*?\n---(?=\n|$)/);
    if (!frontmatterEnd) {
      return 0;
    }

    return frontmatterEnd[0].length;
  }
}
