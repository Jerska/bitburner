/**
 * File:  gitPull.js
 * Usage: gpl [-f]
 *
 * Description: gpl downloads all files from the repository.
 *   If the remote version matches the local version,
 *   the download is skipped unless -f is provided.
 *
 * Options:
 *   -f     Force download, even if version matches existing
 */
import { VERSION_PORT, NO_PORT_DATA, peekPort, upsertPort } from './utils/ports.js';

const TMP_BRANCH_FILE = 'tmp/branch.txt';
const API_TARGET = 'https://api.github.com/repos/jerska/bitburner/commits/main';
const DL_BASE_URL = 'https://raw.githubusercontent.com/jerska/bitburner/main/';

const FILES = ['scripts/utils/ports.js', 'scripts/gitPull.js'];

function cleanup() {
  ns.rm(TMP_BRANCH_FILE);
}

export async function main(ns) {
  const force = ns.args.includes('-f');

  // Fetch GitHub's API
  const success = await ns.wget(API_TARGET, TMP_BRANCH_FILE);
  if (!success) {
    ns.tprint(`Failed to contact GitHub's API: ${API_TARGET}`);
    return;
  }

  // Read GitHub's data
  const data = ns.read(TMP_BRANCH_FILE);
  if (!data) {
    ns.tprint(`Empty response from GitHub's API: ${API_TARGET}`);
    cleanup();
    return;
  }

  // Get sha
  let newSha;
  try {
    ({ newSha } = JSON.parse(data));
  } catch (err) {
    ns.tprint(`Couldn't parse response from GitHub's API: ${API_TARGET}`);
    ns.tprint(`Response:\n${data}`);
    ns.tprint(`Error: ${err.message}`);
    cleanup();
    return;
  }

  // Get current sha
  currentSha = peekPort(ns, VERSION_PORT);
  if (currentSha === NO_PORT_DATA) {
    ns.tprint('No current version found: first installation');
  }

  // Download files
  ns.tprint(`Downloading version ${newSha}`);
  const failed = [];
  for (const file of FILES) {
    const success = await ns.wget(`${DL_BASE_URL}/${file}`, file);
    if (!success) failed.push(file);
    ns.tprint(`* ${file}: ${success ? 'OK' : 'FAILED'}`);
  }

  // Update sha in VERSION_PORT
  upsertPort(ns, VERSION_PORT, newSha);

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
