const fs = require('fs');
const utils = require('./utils');

const FPATH = './data/rotation_rumble_common_words.txt';
const commonWordsRaw = fs.readFileSync(FPATH, { encoding: 'utf8', flag: 'r' });
const commonWords = commonWordsRaw.split('\r\n');


module.exports = {
  spellCheck: testWord => {
    let corrections = [];
    
    for (let word of commonWords) {
      let dist = utils.levensDist(testWord, word);
      corrections.push([word, dist]);
      if (dist === 0) break;
    }

    if (corrections.length === 0) return null;
    
    corrections.sort((a, b) => a[1] - b[1]);
    return corrections[0][0];
  }
}



