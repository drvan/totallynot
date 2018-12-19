export interface TrainingStore {
  upsertEdge(entity: string, gram: string[], starter: boolean, ender: boolean): Promise<void>;
  getStarters(entity: string): Promise<Edge[]>;
  getNexts(entity: string, sequence: string[]): Promise<Edge[]>;
}

export interface Edge {
  count: number;
  readonly ender: boolean;
  readonly entity: string;
  readonly sequence: string[];
  readonly starter: boolean;
  readonly token: string;
}
