import _ from "lodash";
import natural from "natural";
import weighted from "weighted";
import { TrainingStore } from "./TrainingStore";

export class MarkovChain {
  private rt = new natural.RegexpTokenizer({pattern: /\s/});
  private ng = natural.NGrams;

  constructor(private readonly store: TrainingStore) {
  }

  public train(snowflake: string, entity: string, message: string, order: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const grams = this.ng.ngrams(this.rt.tokenize(message), order);
      if (grams.length === 1) {
        try {
          await this.store.upsertEdge(snowflake, entity, grams[0], true, true);
        } catch (e) {
          return reject(e);
        }
      } else {
        grams.map(async (gram, index) => {
          try {
            switch (index) {
              case 0: {
                await this.store.upsertEdge(snowflake, entity, gram, true, false);
                break;
              }
              case grams.length - 1: {
                await this.store.upsertEdge(snowflake, entity, gram, false, true);
                break;
              }
              default: {
                await this.store.upsertEdge(snowflake, entity, gram, false, false);
                break;
              }
            }
          } catch (e) {
            return reject(e);
          }
        });
      }
      return resolve();
    });
  }

  public generate(entity: string, chain: string[], order: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (_.isEmpty(chain)) {
        try {
          const starters = await this.store.getStarters(entity);
          const s = _.sample(starters);
          if (s) {
            try {
              const res = await this.generate(entity, s.sequence.concat(s.token), order);
              return resolve(res);
            } catch (e) {
              return reject(e);
            }
          } else {
            return reject(new Error("No starters available for entity."));
          }
        } catch (e) {
          return reject(e);
        }
      }

      try {
        const nexts = await this.store.getNexts(entity, chain.slice(1 - order));
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
              const res = await this.generate(entity, chain.concat(next.token), order);
              return resolve(res);
            } catch (e) {
              return reject(e);
            }
          }
        }
      } catch (e) {
        return reject(e);
      }
    });
  }
}
