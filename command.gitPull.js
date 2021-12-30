/**
 * File:  gitPull.js
 *
 * Description: gpl downloads all files from the repository.
 *   If the remote version matches the local version,
 *   the download is skipped unless -f is provided.
 *
 * Options:
 *   -f     Force download, even if version matches existing
 */
const USAGE = 'gpl [-f] [<sha>]';

import { readData, upsertData } from './utils.data.js';
import { parseArgs } from './utils.args.js';

import { NO_DATA } from './utils.data.js';

const TMP_BRANCH_FILE = 'tmp.branch.txt';
const API_TARGET = 'https://api.github.com/repos/jerska/bitburner/commits/main';
const DL_BASE_URL = 'https://raw.githubusercontent.com/jerska/bitburner/';

const FILES = ['utils.args.js', 'utils.data.js', 'command.gitPull.js'];

function cleanup(ns) {
  ns.rm(TMP_BRANCH_FILE);
}

function fileUrl(sha, file) {
  return `${DL_BASE_URL}/${sha}/${file}`;
}

export async function main(ns) {
  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  let newSha = args[0] ?? null;
  const force = opts.f;

  if (!newSha) {
    // Fetch GitHub's API
    const success = await ns.wget(API_TARGET, TMP_BRANCH_FILE);
    if (!success) {
      ns.tprint(`Failed to contact GitHub's API: ${API_TARGET}`);
      return;
    }

    // Read GitHub's data
    const branch = ns.read(TMP_BRANCH_FILE);
    if (!branch) {
      ns.tprint(`Empty response from GitHub's API: ${API_TARGET}`);
      cleanup(ns);
      return;
    }

    // Get sha
    let branchData;
    try {
      branchData = JSON.parse(branch);
      newSha = branchData.sha;
    } catch (err) {
      ns.tprint(`Couldn't parse response from GitHub's API: ${API_TARGET}`);
      ns.tprint(`Response:\n${branch}`);
      ns.tprint(`Error: ${err.message}`);
      cleanup(ns);
      return;
    }
    if (!newSha) {
      ns.tprint(`Couldn't retrieve sha from GitHub`);
      ns.tprint(`GitHub's API response:\n${JSON.stringify(branchData, null, 2)}`);
      cleanup(ns);
      return;
    }
  }

  // Get current sha
  const currentSha = readData(ns, 'version');
  if (currentSha === NO_DATA) {
    ns.tprint('No current version found: first installation');
  }

  // Abort if shas are identical
  if (!force && currentSha === newSha) {
    ns.tprint(`Sha ${newSha} is the same as currently installed, aborting.`);
    ns.tprint('To force installation, pass `-f`.');
    cleanup(ns);
    return;
  }

  // Download files
  ns.tprint(`Downloading version ${newSha}`);
  const failed = [];
  for (const file of FILES) {
    const success = await ns.wget(fileUrl(newSha, file), file);
    if (!success) failed.push(file);
    ns.tprint(`* ${file}: ${success ? 'OK' : 'FAILED'}`);
  }

  // Update version data
  await upsertData(ns, 'version', newSha);

  // Print summary
  if (failed.length > 0) {
    ns.tprint('Failed to pull some files:');
    for (const file of failed) {
      ns.tprint(`* ${file}`);
    }
  } else {
    ns.tprint(`Successfully pulled version ${newSha}`);
  }

  // Cleanup
  cleanup(ns);
}
