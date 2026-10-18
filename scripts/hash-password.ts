import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";

function askPassword(): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) return Promise.reject(new Error("Run this command in an interactive terminal."));
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write("Admin password (input hidden): ");
  return new Promise((resolve, reject) => {
    let password = "";
    const finish = (error?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(password);
    };
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") return finish(new Error("Cancelled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") password = password.slice(0, -1);
        else password += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const password = await askPassword();
  if (password.length < 12) throw new Error("Use at least 12 characters.");
  console.log(await bcrypt.hash(password, 12));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not hash password.");
  process.exitCode = 1;
});
