// Detector.ts
export abstract class Detector {
  id: string; // Added for database persistence
  name: string;
  enabled: boolean;
  lastRun: Date | null;

  constructor(name: string, id: string = '') { // id is optional for new detectors
    this.id = id;
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