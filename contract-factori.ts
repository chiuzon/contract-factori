import { parse } from "https://deno.land/std/flags/mod.ts";
import * as log from "https://deno.land/std@0.132.0/log/mod.ts";
import { CliArgs } from "./types.ts";

async function main(args: CliArgs): Promise<void> {
  if (Deno.args.length <= 1) {
    log.info(`
    Parse Alchemix ABis files and addresses for doing multichain stuff

    contract-factori --filename ETH_ADDRESSES --in "./example/abi" --out "./example"
    `);

    return;
  }

  if (!args.in) {
    log.error("Input path not specified (--in)");
    return;
  }

  if (!args.out) {
    log.error("Output path not specified (--out)");
    return;
  }

  const filename = args.filename ? args.filename : "ADDRESSES";

  await scrapAddresses(args.in, args.out, filename);
  await cleanABIs(args.in, args.out);
}

async function scrapAddresses(
  inPath: string,
  outPath: string,
  filename: string
): Promise<void> {
  const ADDRESSES: {
    [key: string]: string;
  } = {};

  try {
    for await (const f of Deno.readDir(inPath)) {
      const _abiFile = await Deno.readTextFile(`${inPath}/${f.name}`);
      const abiFile = JSON.parse(_abiFile);

      const _name = f.name.substring(0, f.name.indexOf("."));

      ADDRESSES[_name] = abiFile.address;
    }
  } catch (err) {
    log.error(err);
  }

  if (Object.keys(ADDRESSES).length > 0) {
    try {
      Deno.writeTextFileSync(
        `${outPath}/${filename}.json`,
        JSON.stringify(ADDRESSES)
      );
      log.info(`Addresses parsed to ${outPath}/${filename}.json`);
    } catch (err) {
      log.error(err);
    }
  }
}

async function cleanABIs(inPath: string, outPath: string) {
  const ABIs: {
    [key: string]: [];
  } = {};

  try {
    for await (const f of Deno.readDir(inPath)) {
      const _abiFile = await Deno.readTextFile(`${inPath}/${f.name}`);
      const abiFile = JSON.parse(_abiFile);

      const _index = f.name.indexOf("_");

      if (_index === -1) {
        const _name = f.name.substring(0, f.name.indexOf("."));

        if (!Object.keys(ABIs).includes(_name)) {
          ABIs[_name] = abiFile.abi;
        }
      } else {
        const _name = f.name.substring(0, f.name.indexOf("_"));
        if (!Object.keys(ABIs).includes(_name)) {
          ABIs[_name] = abiFile.abi;
        }
      }
    }
  } catch (err) {
    log.error(err);
  }

  if (Object.keys(ABIs).length > 0) {
    try {
      for (const objKey of Object.keys(ABIs)) {
        Deno.writeTextFileSync(
          `${outPath}/${objKey}.json`,
          JSON.stringify(ABIs[objKey])
        );
      }
      log.info(`ABIs cleaned to ${outPath}`);
    } catch (err) {
      log.error(err);
    }
  }
}

if (import.meta.main) {
  main(parse(Deno.args) as CliArgs);
}
