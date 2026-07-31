#!/usr/bin/env bun

import { execSync } from "node:child_process";

const [, , cmd, ...args] = process.argv;

function run(command: string, commandArgs: string[] = []): boolean {
	try {
		execSync([command, ...commandArgs].join(" "), {
			stdio: "inherit",
		});

		return true;
	} catch (error: unknown) {
		console.error(
			"Command failed:",
			error instanceof Error ? error.message : String(error),
		);

		return false;
	}
}

function quote(value: string): string {
	return `"${value.replaceAll('"', '\\"')}"`;
}

switch (cmd) {
	case "remove-git": {
		console.log("Removing Git from this project...");

		run("powershell", ["-Command", "Remove-Item -Recurse -Force .git"]);

		break;
	}

	case "change-repo": {
		const repoUrl = args[0];

		if (!repoUrl) {
			console.error("Please provide a new repo URL!");
			break;
		}

		console.log(`Changing Git remote to ${repoUrl}...`);

		run("git", ["remote", "set-url", "origin", repoUrl]);

		break;
	}

	case "show-git": {
		console.log("Current Git info:");

		run("git", ["remote", "-v"]);
		run("git", ["branch", "--show-current"]);
		run("git", ["status"]);

		break;
	}

	case "add-git": {
		const commitMsg = args.join(" ") || "Commit";

		console.log("Adding all changes, committing, and pushing...");

		run("git", ["add", "."]);
		run("git", ["commit", "-m", quote(commitMsg)]);
		run("git", ["push", "-u", "origin", "main"]);

		break;
	}

	default: {
		console.log(`
Usage:
  remove-git          Remove Git from project
  change-repo URL     Change Git remote to new URL
  show-git            Show repo info
  add-git [message]   Add all, commit, and push
`);
	}
}
