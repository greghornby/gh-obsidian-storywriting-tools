import { MarkdownView } from 'obsidian';
import { State } from './State';
import { StoryHUD } from './StoryHUD';

type EditorPosition = {
  line: number;
  ch: number;
};

export class PageController {
  constructor(
    private state: State,
    private storyHUD: StoryHUD,
  ) {}

  register() {
    this.storyHUD.plugin.app.workspace.onLayoutReady(() => {
      this.render();
    });

    this.storyHUD.plugin.registerEvent(
      this.storyHUD.plugin.app.workspace.on('active-leaf-change', () => {
        this.render();
      }),
    );

    this.storyHUD.plugin.registerEvent(
      this.storyHUD.plugin.app.workspace.on('layout-change', () => {
        this.render();
      }),
    );
  }

  unregister() {
    document
      .querySelectorAll('.gh-frontmatter-hidden')
      .forEach((el) => el.classList.remove('gh-frontmatter-hidden'));
  }

  render() {
    this.setMetadataVisibility();
  }

  setMetadataVisibility() {
    document
      .querySelectorAll('.gh-frontmatter-hidden')
      .forEach((el) => el.classList.remove('gh-frontmatter-hidden'));

    for (const target of this.storyHUD.getTargets()) {
      target.el.classList.toggle(
        'gh-frontmatter-hidden',
        !this.state.isMetadataVisible(target.filePath),
      );
    }
  }

  addAtCursor(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.getActiveMarkdownView()?.editor;
    if (!editor) {
      return;
    }

    const cursor = editor.getCursor();

    editor.replaceRange(text, cursor);

    if (moveCursorAfterInsertion) {
      editor.setCursor(this.getInsertionEnd(cursor, text));
    }
  }

  addOnNextLine(text: string, moveCursorAfterInsertion: boolean) {
    const editor = this.getActiveMarkdownView()?.editor;
    if (!editor) {
      return;
    }

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

  private getActiveMarkdownView() {
    return this.storyHUD.plugin.app.workspace.getActiveViewOfType(MarkdownView);
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
