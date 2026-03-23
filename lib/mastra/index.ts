import { Mastra } from "@mastra/core";
import { chatAgent } from "./agent";

export const mastra = new Mastra({
  agents: {
    chatAgent,
  },
});
