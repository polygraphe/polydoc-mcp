export class PromptBuilder {
    private parts: string[] = [];

  public add(text: string): this {
    this.parts.push(text.trim());
    return this;
  }

  public addInstruction(instruction: string): this {
    this.parts.push(`Instruction:\n${instruction.trim()}`);
    return this;
  }

  addTables(tables: string[]): this {
    const formatted = tables.map(t => `- ${t.trim()}`).join("\n");
    this.parts.push(`Tables:\n${formatted}`);
    return this;
  }

  public build(): string {
    return this.parts.join('\n\n').trim();
  }

  public reset(): this {
    this.parts = [];
    return this;
  }
}