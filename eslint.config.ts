import { isentinel } from "@isentinel/eslint-config";

export default isentinel({
	formatters: {
		lua: false,
	},
	ignores: ["README.md", "default.project.json"],
	markdown: false,
	toml: false,
	type: "package",
});
