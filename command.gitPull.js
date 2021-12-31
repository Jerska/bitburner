/**
 * Description: gpl downloads all files from the repository.
 *   If the remote version matches the local version,
 *   the download is skipped unless -f is provided.
 *
 * Options:
 *   -f     Force download, even if version matches existing
 *   -d     Daemon mode: automatically pulls every 10 minutes
 */
const USAGE = 'gpl [-d][-f] [<sha>]';

import { readData, upsertData } from './utils.data.js';
import { parseArgs } from './utils.args.js';
import { createDaemonRunner } from './utils.daemon.js';

import { NO_DATA } from './utils.data.js';

const DAEMON_RUN_EVERY = 10 * 60 * 1000;
const BASE_HOST = 'home';
const FILES_FILE = 'json.files.txt';
const TMP_BRANCH_FILE = 'tmp.json.branch.txt';
const API_TARGET = 'https://api.github.com/repos/jerska/bitburner/commits/main';
const DL_BASE_URL = 'https://raw.githubusercontent.com/jerska/bitburner/';

const PREFIXES = ['command.', 'json.', 'solver.', 'utils.'];

function cleanupBranchFile(ns) {
  ns.rm(TMP_BRANCH_FILE);
}

function fileUrl(sha, file) {
  return `${DL_BASE_URL}/${sha}/${file}`;
}

async function downloadFile(ns, currentFiles, failedFiles, log, newSha, file) {
  let modifier = '+';
  let suffix = '';
  let currentBody = null;
  let newBody = null;

  const existed = currentFiles.includes(file);
  if (existed) {
    currentBody = ns.read(file);
  }

  const url = fileUrl(newSha, file);
  const success = await ns.wget(url, file);
  if (success) {
    newBody = ns.read(file);
    if (existed) {
      modifier = newBody === currentBody ? '=' : '~';
    }
  } else {
    modifier = '#';
    suffix = ' [FAILED]';
    failedFiles.push(file);
  }

  log(`${modifier} ${file}${suffix}`);
  return newBody;
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  let newSha = args[0] ?? null;
  const force = opts.f;
  const isDaemon = opts.d;

  if (newSha !== null && isDaemon) {
    ns.tprint(`Can't use -d option with a specific sha`);
  }

  const cleanup = () => cleanupBranchFile(ns);
  const runner = createDaemonRunner(ns, isDaemon, { cleanup, sleepDuration: DAEMON_RUN_EVERY });
  await runner(async (log, logError) => {
    const currentFiles = ns.ls(BASE_HOST).filter((f) => PREFIXES.some((p) => f.startsWith(p)));

    if (!newSha) {
      // Fetch GitHub's API
      const success = await ns.wget(API_TARGET, TMP_BRANCH_FILE);
      if (!success) {
        logError(`Failed to contact GitHub's API: ${API_TARGET}`);
        return;
      }

      // Read GitHub's data
      const branch = ns.read(TMP_BRANCH_FILE);
      if (!branch) {
        logError(`Empty response from GitHub's API: ${API_TARGET}`);
        return;
      }

      // Get sha
      let branchData;
      try {
        branchData = JSON.parse(branch);
        newSha = branchData.sha;
      } catch (err) {
        logError(`Couldn't parse response from GitHub's API: ${API_TARGET}`);
        logError(`Response:\n${branch}`);
        logError(`Error: ${err.message}`);
        return;
      }
      if (!newSha) {
        logError(`Couldn't retrieve sha from GitHub`);
        logError(`GitHub's API response:\n${JSON.stringify(branchData, null, 2)}`);
        return;
      }
    }

    // Get current sha
    const currentSha = readData(ns, 'version');
    if (currentSha === NO_DATA) {
      logError('No current version found: first installation');
    }

    // Abort if shas are identical
    if (!force && currentSha === newSha) {
      logError(`Sha ${newSha} is the same as currently installed, aborting.`);
      logError('To force installation, pass `-f`.');
      return;
    }

    log(`Downloading version ${newSha}`);
    let failedFiles = [];

    // Download the list of files
    const newFilesRaw = await downloadFile(ns, currentFiles, failedFiles, log, newSha, FILES_FILE);
    if (!newFilesRaw) {
      logError(`Couldn't read ${FILES_FILE} to list the new files to install.`);
      return;
    }
    let newFiles;
    try {
      newFiles = JSON.parse(newFilesRaw);
    } catch (err) {
      logError(`Couldn't parse ${FILES_FILE} to list new files to install.`);
      return;
    }

    // Download files
    for (const file of newFiles) {
      await downloadFile(ns, currentFiles, failedFiles, log, newSha, file);
    }

    // Cleanup old files
    for (const file of currentFiles) {
      if (file === FILES_FILE) continue;
      if (newFiles.includes(file)) continue;
      log(`- ${file}`);
      ns.rm(file);
    }

    // Update version data
    await upsertData(ns, 'version', newSha);

    // Print summary
    if (failedFiles.length > 0) {
      const formattedFiles = failedFiles.map((f) => `* Failed: ${f}`);
      logError(`Failed to pull some files:\n${formattedFiles.join('\n')}`);
    } else {
      log(`Successfully pulled version ${newSha}`);
    }
  });
}
