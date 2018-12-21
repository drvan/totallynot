import { MarkovChain } from "./MarkovChain";
// import { MemoryTrainingStore } from "./MemoryTrainingStore";
import { SqliteTrainingStore } from "./SqliteTrainingStore";

// Generated via https://jsipsum.lunarlogic.io/
const sampleMessages = [
  "Pattern is a cross-platform desktop and the number of a lightweight jQuery is a way of documents",
  "Applications such a library for Web analytics, ad tracking, personalization or other projects",
  "Chai is an assertion library with first-class functions, making an API that HTML",
  "BEM is a design pattern conceptually based on the result of the client and update the DOM of the page",
  "SpiderMonkey, is a class to ease React Native development environment",
  "Gulp is used by Nitobi",
  "Lodash is a JavaScript developer",
  "Pattern is a pattern that gets called immediately after declaration",
  "Revealing Module Pattern is running, but more responsive",
  "CouchDB is a JavaScript code linter",
];

test("training MemoryMarkovChain", async () => {
  expect.assertions(1);
  const ts = new SqliteTrainingStore(":memory:");
  await ts.init();
  const mmc = new MarkovChain(ts);
  sampleMessages.map(async (message) => {
    await mmc.train("000000000000000001", "user", message, 2);
  });

  await mmc.generate("user", [], 2);
  const snowflake = await ts.getLatestSnowflake();
  expect(snowflake).toEqual("000000000000000001");
});
