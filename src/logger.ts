import chalk from "chalk";

export function log(msg: string) {
  console.log(msg);
}

export function success(msg: string) {
  console.log(chalk.green(msg));
}

export function warning(msg: string) {
  console.warn(chalk.yellow(msg));
}
