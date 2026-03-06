import { Command } from "commander";
import { fail } from "../output.js";

export function registerQueryCommands(program: Command): void {
  program
    .command("today")
    .description("Today's full summary")
    .action(() => fail("Not implemented yet — see issue #5"));

  program
    .command("week")
    .description("Weekly summary")
    .action(() => fail("Not implemented yet — see issue #5"));

  program
    .command("trend")
    .description("Trend data for a metric")
    .argument("<metric>", "Metric to trend (weight, sleep, etc.)")
    .option("--days <n>", "Number of days", "30")
    .action(() => fail("Not implemented yet — see issue #5"));

  program
    .command("streak")
    .description("Current streak for a metric")
    .argument("<metric>", "Metric (alcohol-free, fasting)")
    .action(() => fail("Not implemented yet — see issue #5"));

  program
    .command("status")
    .description("Overall dashboard summary")
    .action(() => fail("Not implemented yet — see issue #5"));
}
