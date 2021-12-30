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

function cleanup() {
  ns.rm(TMP_BRANCH_FILE);
}

function fileUrl(sha, file) {
  return `${DL_BASE_URL}/${sha}/${file}`;
}

export async function main(ns) {
  const { args, opts } = parseArgs(ns, { USAGE });
  const force = opts.f;

  if (args.length > 1) {
    ns.tprint('Too');
  }

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
    cleanup();
    return;
  }

  // Get sha
  let newSha;
  try {
    ({ newSha } = JSON.parse(branch));
  } catch (err) {
    ns.tprint(`Couldn't parse response from GitHub's API: ${API_TARGET}`);
    ns.tprint(`Response:\n${branch}`);
    ns.tprint(`Error: ${err.message}`);
    cleanup();
    return;
  }

  // Get current sha
  const currentSha = readData(ns, 'version');
  if (currentSha === NO_DATA) {
    ns.tprint('No current version found: first installation');
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
  upsertData(ns, 'version', newSha);

  // Print summary
  if (failed.length > 0) {
    ns.tprint('Failed to pull some files:');
    for (const file of failed) {
      ns.tprint(`* ${file}`);
    }
  } else {
    ns.tprint(`Successfully pulled version ${newSha}`);
  }
}
