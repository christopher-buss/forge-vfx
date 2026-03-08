local fs = require("@lune/fs")
local process = require("@lune/process")

local OUTPUT = "dist"
local DARKLUA_CONFIG = ".darklua.json"

local barrel = [[
import "./shake"

import VfxForge from "./forge-vfx"

export = VfxForge;
]]

local PROMISE_REQUIRE_PATTERN = "local Promise = [^\n]+Promise[^\n]*\n"
local PROMISE_CALL_PATTERN = "Promise%."
local TS_HEADER = "local TS = _G[script]\n"

local function processRequires(dir: string)
  for _, entry in fs.readDir(dir) do
    local path = `{dir}/{entry}`
    if fs.isDir(path) then
      processRequires(path)
      continue
    end

    if not entry:match("%.luau?$") then
      continue
    end

    local content = fs.readFile(path)
    local modified = false

    -- Replace Promise requires with TS.Promise
    if content:find(PROMISE_REQUIRE_PATTERN) then
      content = content:gsub(PROMISE_REQUIRE_PATTERN, "")
      content = content:gsub(PROMISE_CALL_PATTERN, "TS.Promise.")
      content = TS_HEADER .. content
      modified = true
    end

    -- Replace pkg.Shake with shake module
    if content:find("%.pkg%.Shake") then
      content = content:gsub("%.pkg%.Shake", ".shake")
      modified = true
    end

    if modified then
      fs.writeFile(path, content)
    end
  end
end

local function process_darklua()
  if fs.isDir(OUTPUT) then
    fs.removeDir(OUTPUT)
  end

  fs.writeDir(OUTPUT)

  -- Write project files with $path pointing to "out" for rbxtsc (keep pkg for darklua)
  local project = fs.readFile("default.project.json"):gsub('"src"', '"out"')
  fs.writeFile(OUTPUT .. "/default.project.json", project)

  fs.copy("package.json", OUTPUT .. "/package.json")
  fs.copy("src", OUTPUT .. "/src/forge-vfx")
  fs.copy("pkg", OUTPUT .. "/pkg")
  fs.copy("tsconfig.json", OUTPUT .. "/tsconfig.json")
  fs.copy(".darklua.json", OUTPUT .. "/.darklua.json")
  fs.copy("LICENSE", OUTPUT .. "/LICENSE")
  fs.copy("README.md", OUTPUT .. "/README.md")
  local luaurc = fs.readFile(".luaurc"):gsub("%./src", "./out/forge-vfx")
  fs.writeFile(OUTPUT .. "/.luaurc", luaurc)

  fs.writeFile(OUTPUT .. "/src/shake.ts", 'import shake from "@rbxutil/shake"\nexport { shake };\n')
  fs.writeFile(OUTPUT .. "/src/index.ts", barrel)

  process.exec("pnpm", { "install" }, { shell = true, stdio = "forward", cwd = OUTPUT })
  process.exec("npx", { "rbxtsc", "--verbose" }, { shell = true, stdio = "forward", cwd = OUTPUT })

  process.exec("rojo", {
    "sourcemap",
    OUTPUT .. "/default.project.json",
    "--output",
    OUTPUT .. "/darklua-sourcemap.json",
  }, { stdio = "forward" })

  process.exec("darklua", {
    "process",
    "out/forge-vfx",
    `out/forge-vfx`,
    `--config`,
    DARKLUA_CONFIG,
  }, { stdio = "forward", cwd = OUTPUT })

  processRequires(`{OUTPUT}/out/forge-vfx`)

  -- Remove pkg from project.json before publishing
  project = fs.readFile(OUTPUT .. "/default.project.json"):gsub(',?%s*"pkg":%s*{[^}]*}', "")
  fs.writeFile(OUTPUT .. "/default.project.json", project)
  fs.removeDir(OUTPUT .. "/pkg")
end

return {
  run = process_darklua,
  OUTPUT = OUTPUT,
}
