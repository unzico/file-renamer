import chalk from "chalk";
import fs from "fs";
import path from "path";
import { toPromise } from "./toPromise";

export type Config = {
  sourceDir: string;
  outDir: string;
};

type Options = { config: Config };

export type Type = {
  identifier: RegExp | ((fileName: string) => boolean);
  parser: (fileName: string) => string | Promise<string>;
  message?: string;
};

export class FileRenamer {
  config: Config;
  types: Type[];
  defaultType?: Omit<Type, "identifier">;

  constructor(options: Options) {
    this.config = options.config;
    this.types = [];
  }

  set(types: Type[]) {
    this.types = types;
  }

  setDefault(type: NonNullable<FileRenamer["defaultType"]>) {
    this.defaultType = type;
  }

  add(type: Type) {
    this.types = [...this.types, type];
  }

  /**
   * Runs the renamer once.
   */
  async run(fileName?: string) {
    const self = this;
    const fileNames = fileName ? [fileName] : readSourceFiles(this);
    const jobs = fileNames.map((name) => toPromise<string>(name));

    for await (const name of jobs) {
      const type = identifyType(this, name) ?? this.defaultType;

      if (!type) {
        return;
      }

      const newName = await type.parser(name);
      moveFileToOutDir(self, name, newName);
    }
  }
}

function readSourceFiles(renamer: FileRenamer) {
  return fs.readdirSync(path.resolve(renamer.config.sourceDir));
}

function identifyType(renamer: FileRenamer, fileName: string) {
  let identifier: Type["identifier"];
  let identified = false;

  for (const type of renamer.types) {
    identifier = type.identifier;
    identified = isRegex(identifier)
      ? identifier.test(fileName)
      : identifier(fileName);

    if (identified) return type;
  }
}

function isRegex(value: any): value is RegExp {
  return value instanceof RegExp;
}

function moveFileToOutDir(
  renamer: FileRenamer,
  prevName: string,
  newName: string
) {
  const srcPath = path.resolve(renamer.config.sourceDir, prevName);
  const outPath = path.resolve(renamer.config.outDir, newName);
  fs.renameSync(srcPath, outPath);

  console.log(
    chalk.green(`Renamed ${chalk.bold(prevName)} to ${chalk.bold(newName)}.`)
  );
}
