import { bold } from "kleur";
import fs from "fs";
import path from "path";
import * as Logger from "./logger";
import { toPromise } from "./toPromise";

export type Config = {
  inputDir: string;
  outputDir: string;
  defaultType?: Type;
  types: Type[];
};

export type Type = {
  title?: string;
  identifier: RegExp | ((fileName: string) => boolean);
  parser: (fileName: string) => string | Promise<string>;
};

export class FileRenamer {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Renames all files in the `config.inputDir`, if possible.
   * @param fileName If specified, only this file will be renamed if it exists.
   */
  async renameAll(fileName?: string) {
    const self = this;
    const fileNames = fileName ? [fileName] : readSourceFiles(this);
    const jobs = fileNames.map((name) => toPromise<string>(name));
    const { defaultType } = this.config;

    for await (const name of jobs) {
      let type = identifyType(self, name) ?? defaultType;

      if (!type) {
        Logger.warning(`Could not identify ${fileName}. Skipping.`);
        return;
      }

      const newName = await type.parser(name);
      moveFileToOutputDir(self, name, newName);
    }
  }
}

function readSourceFiles(renamer: FileRenamer) {
  return fs.readdirSync(path.resolve(renamer.config.inputDir));
}

function identifyType(renamer: FileRenamer, fileName: string) {
  const { types } = renamer.config;
  let identifier: Type["identifier"];
  let identified = false;

  for (const type of types) {
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

function moveFileToOutputDir(
  { config }: FileRenamer,
  oldName: string,
  newName: string
) {
  const ext = path.extname(oldName);
  const inputPath = path.resolve(config.inputDir, oldName);
  const outputPath = path.resolve(config.outputDir, newName + ext);

  fs.renameSync(inputPath, outputPath);
  Logger.success(`Renamed ${bold(oldName)} to ${bold(newName)}.`);
}
