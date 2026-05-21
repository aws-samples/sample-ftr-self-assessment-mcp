/**
 * Progress reporter for the interactive CLI.
 * Displays spinner and per-control progress updates during evaluation.
 */

export interface ProgressReporter {
  /** Start the spinner with an initial message */
  start(message: string): void;
  /** Update progress after a control completes */
  update(completed: number, total: number, controlId: string, decision: string): void;
  /** Stop the spinner (success or failure) */
  stop(success: boolean): void;
}

/**
 * Creates a ProgressReporter that uses ora for spinner display.
 * Uses dynamic imports for ESM-only packages (ora, chalk).
 */
export async function createProgressReporter(): Promise<ProgressReporter> {
  const { default: ora } = await import('ora');
  const { default: chalk } = await import('chalk');

  const spinner = ora();

  function colorizeDecision(decision: string): string {
    switch (decision.toUpperCase()) {
      case 'PASS':
        return chalk.green(decision);
      case 'FAIL':
        return chalk.red(decision);
      case 'ERROR':
        return chalk.yellow(decision);
      default:
        return decision;
    }
  }

  return {
    start(message: string): void {
      spinner.start(message);
    },

    update(completed: number, total: number, controlId: string, decision: string): void {
      spinner.text = `[${completed}/${total}] Evaluated ${controlId}: ${colorizeDecision(decision)}`;
    },

    stop(success: boolean): void {
      if (success) {
        spinner.succeed();
      } else {
        spinner.fail();
      }
    },
  };
}
