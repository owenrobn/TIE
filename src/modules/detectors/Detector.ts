// Detector.ts
export abstract class Detector {
  name: string;
  enabled: boolean;
  lastRun: Date | null;

  constructor(name: string) {
    this.name = name;
    this.enabled = true;
    this.lastRun = null;
  }

  abstract detect(): Promise<any[]>;

  async run(): Promise<any[]> {
    if (!this.enabled) {
      return [];
    }

    this.lastRun = new Date();
    return await this.detect();
  }

  toggle(): void {
    this.enabled = !this.enabled;
  }
}