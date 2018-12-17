export interface MarkovChain {
  train(entity: string, message: string): Promise<void>;
  generate(entity: string, chain: string[]): Promise<string>;
}

export interface Edge {
  count: number;
  readonly ender: boolean;
  readonly entity: string;
  readonly sequence: string[];
  readonly starter: boolean;
  readonly token: string;
}
