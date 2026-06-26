import { EditorPosition } from 'obsidian';
import { PageController } from './PageController';
import { StoryWritingToolsPlugin } from './StoryWritingToolsPlugin';

export class PageTools {
  constructor(
    public plugin: StoryWritingToolsPlugin,
    public controller: PageController,
  ) {}

  render() {
    this.setMetadataVisibility();
  }

  get editor() {
    return this.controller.target.markdownView.editor;
  }

  isMetadataVisible() {
    return this.plugin.state.isMetadataVisible(this.controller.filePath);
  }

  toggleMetadataVisibility() {
    this.plugin.state.toggleMetadataHidden(this.controller.filePath);
    this.controller.renderControllersForFile(this.controller.filePath);
  }

  private setMetadataVisibility() {
    this.controller.target.el.classList.toggle(
      'gh-frontmatter-hidden',
      !this.plugin.state.isMetadataVisible(this.controller.filePath),
    );
  }

  addAtCursor(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.editor;
    const cursor = editor.getCursor();

    editor.replaceRange(text, cursor);

    if (moveCursorAfterInsertion) {
      editor.setCursor(this.getInsertionEnd(cursor, text));
    }
  }

  addOnNextLine(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.editor;
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
