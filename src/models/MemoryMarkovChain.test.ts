import { MemoryMarkovChain } from "./MemoryMarkovChain";

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
  const mmc = new MemoryMarkovChain();
  sampleMessages.map(async (message) => {
    await mmc.train("user", message);
  });

  await mmc.generate("user", []);
  // Passes if no error thrown.
});
