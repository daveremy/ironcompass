#!/usr/bin/env node

import { Command } from "commander";
import { registerLogCommands } from "./commands/log.js";
import { registerQueryCommands } from "./commands/query.js";
import { registerPlanCommands } from "./commands/plan.js";

const program = new Command();

program
  .name("ironcompass")
  .description("IronCompass health tracking CLI")
  .version("0.1.0");

registerLogCommands(program);
registerQueryCommands(program);
registerPlanCommands(program);

program.parseAsync();
