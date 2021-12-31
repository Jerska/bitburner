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

const BASE_HOST = 'home';
const FILES_FILE = 'json.files.txt';
const TMP_BRANCH_FILE = 'tmp.json.branch.txt';
const API_TARGET = 'https://api.github.com/repos/jerska/bitburner/commits/main';
const DL_BASE_URL = 'https://raw.githubusercontent.com/jerska/bitburner/';

const PREFIXES = ['command.', 'json.', 'solver.', 'utils.'];

function getCurrentFiles(ns) {
  return ns.ls(BASE_HOST).filter((f) => PREFIXES.some((p) => f.startsWith(p)));
}

function cleanupBranchFile(ns) {
  ns.rm(TMP_BRANCH_FILE);
}

function fileUrl(sha, file) {
  return `${DL_BASE_URL}/${sha}/${file}`;
}

export async function main(ns) {
  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  let newSha = args[0] ?? null;
  const force = opts.f;

  const currentFiles = getCurrentFiles(ns);

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
      cleanupBranchFile(ns);
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
      cleanupBranchFile(ns);
      return;
    }
    if (!newSha) {
      ns.tprint(`Couldn't retrieve sha from GitHub`);
      ns.tprint(`GitHub's API response:\n${JSON.stringify(branchData, null, 2)}`);
      cleanupBranchFile(ns);
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
    cleanupBranchFile(ns);
    return;
  }

  // Download the list of files
  ns.tprint(`Downloading version ${newSha}`);
  const success = await ns.wget(fileUrl(newSha, FILES_FILE), FILES_FILE);
  ns.tprint(`~ ${success ? '' : '[FAILED] '}${FILES_FILE}`);
  const newFilesRaw = ns.read(FILES_FILE);
  if (!newFilesRaw) {
    ns.tprint(`Couldn't read ${FILES_FILE} to list the new files to install.`);
    cleanupBranchFile(ns);
    return;
  }
  let newFiles;
  try {
    newFiles = JSON.parse(newFilesRaw);
  } catch (err) {
    ns.tprint(`Couldn't parse ${FILES_FILE} to list new files to install.`);
    cleanupBranchFile(ns);
    return;
  }

  // Download files
  const failed = [];
  for (const file of newFiles) {
    const success = await ns.wget(fileUrl(newSha, file), file);
    if (!success) failed.push(file);
    const existed = currentFiles.includes(file);
    ns.tprint(`${existed ? '~' : '+'} ${success ? '' : '[FAILED] '}${file}`);
  }
  for (const file of currentFiles) {
    if (newFiles.includes(file)) continue;
    ns.tprint(`- ${file}`);
    // ns.rm(file);
  }

  // Update version data
  await upsertData(ns, 'version', newSha);

  // Print summary
  if (failed.length > 0) {
    ns.tprint('Failed to pull some files:');
    for (const file of failed) {
      ns.tprint(`* Failed: ${file}`);
    }
  } else {
    ns.tprint(`Successfully pulled version ${newSha}`);
  }

  // Cleanup
  cleanupBranchFile(ns);
}
