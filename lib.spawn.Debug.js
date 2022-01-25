export class Debug {
  constructor() {
    this.mainEntries = {};
    this.candidatesEntries = {};
  }

  addMain(key, message) {
    const param = this._buildParam(key, message);
    this.mainEntries = { ...this.mainEntries, ...param };
  }

  addCandidate(candidate, key, message) {
    const param = this._buildParam(key, message);
    this.candidatesEntries[candidate] = { ...this.candidatesEntries[candidate], ...param };
  }

  print(log) {
    let message = `\n`;
    const add = (msg) => {
      message += `\n${msg}`;
    };
    add('Main:');
    for (const [k, v] of Object.entries(this.mainEntries)) {
      add(`* ${k}: ${JSON.stringify(v, null, 2)}`);
    }
    add('Candidates:');
    for (const [candidate, messages] of Object.entries(this.candidatesEntries)) {
      add(`- ${candidate}:`);
      for (const [k, v] of Object.entries(messages)) {
        add(`  * ${k}: ${JSON.stringify(v, null, 2)}`);
      }
    }
    log(message);
  }

  _buildParam(key, message) {
    return typeof key === 'string' ? { [key]: message } : key;
  }
}
