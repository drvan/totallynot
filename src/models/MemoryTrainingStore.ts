import _ from "lodash";
import { Edge, TrainingStore } from "./TrainingStore";

export class MemoryTrainingStore implements TrainingStore {
  private edges: Edge[] = [];
  private latestSnowflake: string = "000000000000000000";

  public getLatestSnowflake(): Promise<string> {
    return new Promise((resolve, reject) => {
      return resolve(this.latestSnowflake);
    });
  }

  public upsertEdge(snowflake: string, entity: string, gram: string[],
                    starter: boolean, ender: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const order = gram.length;
      const i = this.edges.findIndex( (edge) => {
        return ((edge.entity === entity) &&
                (_.isEqual(edge.sequence, gram.slice(0, order - 1))) &&
                (edge.token === gram[order - 1]) &&
                (edge.starter === starter) &&
                (edge.ender === ender));
      });

      if (i === -1) {
        this.edges.push({
          count: 1,
          ender: ender,
          entity: entity,
          sequence: gram.slice(0, order - 1),
          starter: starter,
          token: gram[order - 1],
        });
      } else {
        this.edges[i].count++;
      }
      this.latestSnowflake = snowflake;
      return resolve();
    });
  }

  public getStarters(entity: string): Promise<Edge[]> {
    return new Promise((resolve, reject) => {
      const starters = this.edges.filter((edge) => {
        return ((edge.starter === true) &&
                (edge.ender === false) &&
                (edge.entity === entity));
      });
      return resolve(starters);
    });
  }

  public getNexts(entity: string, sequence: string[]): Promise<Edge[]> {
    return new Promise((resolve, reject) => {
      const nexts = this.edges.filter((edge) => {
        return ((_.isEqual(edge.sequence, sequence)) &&
                (edge.entity === entity));
      });
      return resolve(nexts);
    });
  }
}
