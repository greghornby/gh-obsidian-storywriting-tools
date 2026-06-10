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
}