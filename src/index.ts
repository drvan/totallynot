import Discord from "discord.js";
import dotenv from "dotenv";
import pino from "pino";
import { MarkovChain } from "./models/MarkovChain";
import { MemoryTrainingStore } from "./models/MemoryTrainingStore";

function main() {
  dotenv.config();
  const logger = pino();
  const client = new Discord.Client();
  const mmc = new MarkovChain(new MemoryTrainingStore());

  client.once("ready", () => {
    logger.info("Ready!");
  });

  client.on("error", () => {
    client.login(process.env.DISCORD_BOT_TOKEN);
  });

  client.on("message", async (message) => {
    if (message.isMentioned(client.user)) {
      const entity = message.mentions.users.find( (user) => {
        return (user.bot === false);
      });
      if (entity) {
        try {
          const m = await mmc.generate(entity.id, [], Number(process.env.MARKOV_CHAIN_ORDER));
          message.channel.send(m);
        } catch (e) {
          message.channel.send("Error: I don't have enough data to generate a message for you :(");
          logger.warn(e);
        }
      } else {
        message.channel.send("Error: You must mention a valid user.");
      }
    } else {
      mmc.train(message.author.id, message.content, Number(process.env.MARKOV_CHAIN_ORDER));
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN);

}

main();
