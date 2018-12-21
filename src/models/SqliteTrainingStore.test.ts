import { SqliteTrainingStore } from "./SqliteTrainingStore";

test("initialize sqlite3", async () => {
  // expect.assertions(1);
  const ts = new SqliteTrainingStore(":memory:");
  await ts.init();
  const snowflake = await ts.getLatestSnowflake();
  // console.log(snowflake);
});
