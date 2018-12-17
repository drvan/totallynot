import _ from "lodash";
import natural from "natural";
import weighted from "weighted";
import { Edge, MarkovChain } from "./MarkovChain";

export class MemoryMarkovChain implements MarkovChain {
  private edges: Edge[] = [];
  private rt = new natural.RegexpTokenizer({pattern: /\s/});
  private ng = natural.NGrams;

  public train(entity: string, message: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const grams = this.ng.ngrams(this.rt.tokenize(message), 4);
      if (grams.length === 1) {
        // This is an edge case of an exactly 4 token message
        await this.upsertEdge(entity, grams[0], true, true);
      } else {
        grams.map(async (gram, index) => {
          switch (index) {
            case 0: {
              await this.upsertEdge(entity, gram, true, false);
              break;
            }
            case grams.length - 1: {
              await this.upsertEdge(entity, gram, false, true);
              break;
            }
            default: {
              await this.upsertEdge(entity, gram, false, false);
              break;
            }
          }
        });
      }
      resolve();
    });
  }

  public generate(entity: string, chain: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (_.isEmpty(chain)) {
        const starters = this.edges.filter((edge) => {
          return ((edge.starter === true) &&
                  (edge.ender === false) &&
                  (edge.entity === entity));
        });
        const s = _.sample(starters);
        if (s) {
          try {
            const res = await this.generate(entity, s.sequence.concat(s.token));
            return resolve(res);
          } catch (e) {
            return reject(e);
          }
        } else {
          return reject(new Error("No starters available for entity."));
        }
      }

      const nexts = this.edges.filter((edge) => {
        return ((_.isEqual(edge.sequence, chain.slice(-3))) &&
                (edge.entity === entity));
      });

      if (_.isEmpty(nexts)) {
        return reject(new Error("No additional sequences available"));
      } else {
        // Select weighted from available sequences
        const weights = nexts.map((edge) => {
          return edge.count;
        });
        const next = weighted.select(nexts, weights);
        if (next.ender) {
          return resolve(chain.concat(next.token).join(" "));
        } else {
          try {
            const res = await this.generate(entity, chain.concat(next.token));
            return resolve(res);
          } catch (e) {
            return reject(e);
          }
        }
      }
    });
  }

  public getEdges(): Edge[] {
    return this.edges;
  }

  private upsertEdge(entity: string, gram: string[], starter: boolean, ender: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const i = this.edges.findIndex( (edge) => {
        return ((edge.entity === entity) &&
                (_.isEqual(edge.sequence, gram.slice(0, 3))) &&
                (edge.token === gram[3]) &&
                (edge.starter === starter) &&
                (edge.ender === ender));
      });

      if (i === -1) {
        this.edges.push({
          count: 1,
          ender: ender,
          entity: entity,
          sequence: gram.slice(0, 3),
          starter: starter,
          token: gram[3],
        });
      } else {
        this.edges[i].count++;
      }
      resolve();
    });
  }
}
