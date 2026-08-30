// Chạy Next CLI với `.env`/`.env.local` của app ĐÃ nạp sẵn vào process.env.
//
// Vì sao cần: Next bind HTTP server trước khi nó load env file, nên `PORT` đặt
// trong `.env` bị nó bỏ qua (docs `next.md` §Changing the default port). Muốn
// mỗi app tự khai port trong env file của mình thì phải nạp file TRƯỚC khi gọi
// Next — đó là việc duy nhất của script này.
//
// Không dùng `node --env-file-if-exists=... next dev`: Next dev spawn worker và
// truyền execArgv của process cha qua NODE_OPTIONS, mà `--env-file*` không được
// phép nằm trong NODE_OPTIONS → worker chết ngay với exit code 9.
//
// Thứ tự ưu tiên: biến của shell > .env.local > .env (giống Next).
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const fromShell = new Set(Object.keys(process.env));

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (!fromShell.has(key)) process.env[key] = value;
  }
}

// Resolve `next` theo THƯ MỤC APP chứ không theo vị trí script: script nằm ở gốc
// repo, mà gốc repo không có `next` trong dependency (pnpm không hoist).
const require = createRequire(pathToFileURL(`${process.cwd()}/package.json`));

// import động: next bin tự đọc process.argv.slice(2), tức `dev`/`start` truyền
// vào script này rơi đúng chỗ. Chạy in-process nên NODE_OPTIONS vẫn sạch.
await import(pathToFileURL(require.resolve("next/dist/bin/next")));
