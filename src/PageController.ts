import { PageTarget } from './PageTarget';
import { PageUIToolbar } from './PageUIToolbar';
import { State } from './State';

type EditorPosition = {
  line: number;
  ch: number;
};

export class PageController {
  readonly toolbar: PageUIToolbar;

  constructor(
    private target: PageTarget,
    private state: State,
    private renderControllersForFile: (filePath: string) => void,
  ) {
    this.toolbar = new PageUIToolbar(this, this.target);
  }

  get mode() {
    return this.target.mode;
  }

  get filePath() {
    return this.target.filePath;
  }

  get containerEl() {
    return this.target.containerEl;
  }

  get el() {
    return this.target.el;
  }

  get leaf() {
    return this.target.leaf;
  }

  get markdownView() {
    return this.target.markdownView;
  }

  setTarget(target: PageTarget) {
    this.target = target;
    this.toolbar.setTarget(target);
  }

  register() {
    this.target.containerEl.classList.add("storytools");
    this.target.el.classList.add(`storytools-mode-${this.target.mode}`);
    this.toolbar.register();
    this.render();
  }

  unregister() {
    this.toolbar.unregister();
    this.target.el.classList.remove('gh-frontmatter-hidden');
  }

  render() {
    this.toolbar.render();
    this.setMetadataVisibility();
  }

  toggleMetadataVisibility() {
    this.state.toggleMetadataHidden(this.filePath);
    this.renderControllersForFile(this.filePath);
  }

  isMetadataVisible() {
    return this.state.isMetadataVisible(this.filePath);
  }

  addAtCursor(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.target.markdownView.editor;
    const cursor = editor.getCursor();

    editor.replaceRange(text, cursor);

    if (moveCursorAfterInsertion) {
      editor.setCursor(this.getInsertionEnd(cursor, text));
    }
  }

  addOnNextLine(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.target.markdownView.editor;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);

    if (line.trim().length === 0) {
      const insertion = `${text}\n`;
      const start = {line: cursor.line, ch: 0};

      editor.replaceRange(insertion, start, {line: cursor.line, ch: line.length});

      if (moveCursorAfterInsertion) {
        editor.setCursor(this.getInsertionEnd(start, insertion));
      }

      return;
    }

    const insertion = `\n${text}\n`;
    const start = {line: cursor.line, ch: line.length};

    editor.replaceRange(insertion, start);

    if (moveCursorAfterInsertion) {
      editor.setCursor(this.getInsertionEnd(start, insertion));
    }
  }

  private setMetadataVisibility() {
    this.target.el.classList.toggle(
      'gh-frontmatter-hidden',
      !this.state.isMetadataVisible(this.filePath),
    );
  }

  private getInsertionEnd(start: EditorPosition, text: string): EditorPosition {
    const lines = text.split('\n');

    if (lines.length === 1) {
      return {
        line: start.line,
        ch: start.ch + text.length,
      };
    }

    return {
      line: start.line + lines.length - 1,
      ch: lines[lines.length - 1]?.length ?? 0,
    };
  }
}
