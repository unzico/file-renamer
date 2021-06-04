import { green, yellow } from "kleur";

export function log(msg: string) {
  console.log(msg);
}

export function success(msg: string) {
  console.log(green(msg));
}

export function warning(msg: string) {
  console.warn(yellow(msg));
}
