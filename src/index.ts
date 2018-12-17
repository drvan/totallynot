import Discord from "discord.js";
import dotenv from "dotenv";
import pino from "pino";
import { MemoryMarkovChain } from "./models/MemoryMarkovChain";

function main() {
  dotenv.config();
  const logger = pino();
  const client = new Discord.Client();
  const mmc = new MemoryMarkovChain();

  client.once("ready", () => {
      logger.info("Ready!");
  });

  client.on("message", async (message) => {
    if (message.isMentioned(client.user)) {
      const entity = message.mentions.users.find( (user) => {
        return (user.bot === false);
      });
      if (entity) {
        try {
          const m = await mmc.generate(entity.id, []);
          message.channel.send(m);
        } catch (e) {
          message.channel.send("Error: I don't have enough data to generate a message for you :(");
          logger.warn(e);
        }
      } else {
        message.channel.send("Error: You must mention a valid user.");
      }
    } else {
      mmc.train(message.author.id, message.content);
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN);

}

main();
