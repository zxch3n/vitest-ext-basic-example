import { exec } from "child_process";
import { writeFile } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { promisify } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    await run("yarn");
  } catch (e) {
    await run("npm install");
  }

  await promisify(writeFile)(
    resolve(__dirname, ".vscode/settings.json"),
    JSON.stringify(
      {
        "vitest.commandLine": "./node_modules/.bin/vitest",
        "vitest.nodeEnv": { PATH: process.env.PATH },
      },
      undefined,
      2
    )
  );

  console.log("Vitest settings updated");
  const { default: envinfo } = await import("envinfo");
  const infoStr = await envinfo.run(
    {
      System: ["OS"],
      Binaries: ["Node", "Yarn", "npm"],
      npmPackages: ["vite", "vitest"],
      IDEs: ["VSCode"],
    },
    { json: true, showNotFound: true }
  );
  const info = JSON.parse(infoStr);
  const code = info["IDEs"]["VSCode"] && info["IDEs"]["VSCode"]["path"];
  if (code) {
    await run(
      `"${code}" --install-extension zixuanchen.vitest-explorer --pre-release --force`
    );
  } else {
    throw new Error("VS Code not found");
  }

  await promisify(writeFile)(resolve(__dirname, "info.txt"), infoStr);
}

function run(command) {
  const child = exec(command);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  return new Promise((resolve, reject) => {
    child.on("exit", function (code) {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

main();
