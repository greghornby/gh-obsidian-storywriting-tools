import { PageLinter } from './PageLinter';
import { PageTarget } from './PageTarget';
import { PageTools } from './PageTools';
import { PageUIToolbar } from './PageUIToolbar';
import { StoryWritingToolsPlugin } from './StoryWritingToolsPlugin';

export class PageController {
  readonly toolbar: PageUIToolbar;
  readonly tools: PageTools;
  readonly linter: PageLinter;

  constructor(
    public plugin: StoryWritingToolsPlugin,
    public target: PageTarget,
    public renderControllersForFile: (filePath: string) => void,
  ) {
    this.tools = new PageTools(this.plugin, this);
    this.toolbar = new PageUIToolbar(this.plugin, this);
    this.linter = new PageLinter(this.plugin, this);
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
    this.removePageClasses();
    this.target = target;
    this.applyPageClasses();
  }

  register() {
    console.log("Registered controller for file", this.filePath);
    this.applyPageClasses();
    this.linter.register();
    this.toolbar.register();
    this.render();
  }

  unregister() {
    this.linter.unregister();
    this.toolbar.unregister();
    this.target.el.classList.remove('gh-frontmatter-hidden');
    this.removePageClasses();
  }

  render() {
    this.applyPageClasses();
    this.toolbar.render();
    this.tools.render();
  }

  private applyPageClasses() {
    this.target.containerEl.classList.add('storytools');
    this.target.el.classList.add(`storytools-mode-${this.target.mode}`);
  }

  private removePageClasses() {
    this.target.containerEl.classList.remove('storytools');
    this.target.el.classList.remove(
      'storytools-mode-edit',
      'storytools-mode-preview',
    );
  }
}
