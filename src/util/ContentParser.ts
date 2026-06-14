export class ContentParser {

  static getBodyStart(content: string) {
    if (!content.startsWith('---\n')) {
      return 0;
    }

    const frontmatterEnd = content.match(/^---\n[\s\S]*?\n---(?=\n|$)/);
    if (!frontmatterEnd) {
      return 0;
    }

    return frontmatterEnd[0].length;
  }

  static parseContentToBodyAndFrontmatter(content: string): {body: string; frontmatter: string} {
    const bodyStart = this.getBodyStart(content);
    const frontmatter = content.slice(0, bodyStart);
    const body = content.slice(bodyStart);
    return {body, frontmatter};
  }

  static createContentFromBodyAndFrontmatter({body, frontmatter}: {body: string; frontmatter: string}): string {
    return `${frontmatter}${body}`;
  }

  static WORD_COUNT_REGEX = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
  static wordCount(content: string, removeMarkdown = true, removeComments = true) {
    let normalizedContent = content;
    if (removeMarkdown) {
        normalizedContent = normalizedContent
            .replace(/`\$?=[^`]+`/g, "") // inline dataview
            .replace(/^---\n.*?\n---\n/s, "") // YAML Header
            .replace(/!?\[(.+)\]\(.+\)/g, "$1") // URLs & Image Captions
            .replace(/\*|_|\[\[|\]\]|\||==|~~|---|#|> |`/g, ""); // Markdown Syntax
    }
    if (removeComments) {
        normalizedContent = normalizedContent
            .replace(/<!--.*?-->/gs, "") // HTML comments
            .replace(/%%.*?%%/gs, ""); // Markdown comments
    }
    return (normalizedContent.match(this.WORD_COUNT_REGEX) || []).length;
}
}