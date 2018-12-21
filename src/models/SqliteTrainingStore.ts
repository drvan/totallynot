import sqlite3 from "sqlite3";
import { Edge, TrainingStore } from "./TrainingStore";

export class SqliteTrainingStore implements TrainingStore {
  private readonly db: sqlite3.Database;

  constructor(filepath: string) {
    this.db = new sqlite3.Database(filepath);
  }

  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(`CREATE TABLE IF NOT EXISTS edge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        count INTEGER NOT NULL,
        ender INTEGER NOT NULL,
        entity TEXT NOT NULL,
        sequence TEXT NOT NULL,
        starter INTEGER NOT NULL,
        token TEXT NOT NULL,
        CONSTRAINT edge_unique UNIQUE (ender, entity, sequence, starter, token)
      );`, (err) => {
          if (err) {
            return reject(err);
          }
          this.db.exec(`CREATE TABLE IF NOT EXISTS latest_snowflake (
          snowflake TEXT NOT NULL
        );`, (err) => {
              if (err) {
                return reject(err);
              }
              this.db.exec(`INSERT INTO latest_snowflake VALUES(
            '000000000000000000'
          );`, (err) => {
                  if (err) {
                    return reject(err);
                  } else {
                    return resolve();
                  }
                });
            });
        });
    });
  }

  public getLatestSnowflake(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT snowflake FROM latest_snowflake;`, (err, row) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(row.snowflake);
        }
      });
    });
  }

  public upsertEdge(snowflake: string, entity: string, gram: string[],
                    starter: boolean, ender: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const order = gram.length;
      this.db.run(`INSERT INTO edge (count, ender, entity, sequence, starter, token)
                  VALUES(1, ?, ?, ?, ?, ?)
                  ON CONFLICT(ender, entity, sequence, starter, token)
                  DO UPDATE SET count = count + 1;`,
        [
          ender, entity, JSON.stringify(gram.slice(0, order - 1)),
          starter, gram[order - 1],
        ], (err) => {
        if (err) {
          return reject(err);
        }
        this.db.run(`UPDATE latest_snowflake SET snowflake = ?;`,
          snowflake,
          (err) => {
          if (err) {
            return reject(err);
          } else {
            return resolve();
          }
        });
      });
    });
  }

  public getStarters(entity: string): Promise<Edge[]> {
    return new Promise((resolve, reject) => {
      const starters: Edge[] = [];
      this.db.each(`SELECT * FROM edge WHERE
                    starter = 1 AND
                    ender = 0 AND
                    entity = ?;`, entity, (err, row) => {
        if (err) {
          return reject(err);
        }
        starters.push({count: row.count,
          ender: (row.ender) ? true : false,
          entity: row.entity,
          sequence: JSON.parse(row.sequence),
          starter: (row.starter) ? true : false,
          token: row.token});
      }, (err) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(starters);
        }
      });
    });
  }

  public getNexts(entity: string, sequence: string[]): Promise<Edge[]> {
    return new Promise((resolve, reject) => {
      const nexts: Edge[] = [];
      this.db.each(`SELECT * FROM edge WHERE
                    sequence = ? AND
                    entity = ?;`, [JSON.stringify(sequence), entity],
                    (err, row) => {
        if (err) {
          return reject(err);
        }
        nexts.push({count: row.count,
          ender: (row.ender) ? true : false,
          entity: row.entity,
          sequence: JSON.parse(row.sequence),
          starter: (row.starter) ? true : false,
          token: row.token});
      }, (err) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(nexts);
        }
      });
    });
  }
}
