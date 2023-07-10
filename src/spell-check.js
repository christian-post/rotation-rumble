const fs = require('fs');
const utils = require('./utils');

const fpathEffects = './data/common_words_effects.txt';
const fpathNames = './data/common_words_names.txt';

const commonWordsEffectsRaw = fs.readFileSync(fpathEffects, { encoding: 'utf8', flag: 'r' });
const commonWordsNamesRaw = fs.readFileSync(fpathNames, { encoding: 'utf8', flag: 'r' });

let commonWords = [];

if (commonWordsEffectsRaw.includes('\r')) {
  commonWords.effects = commonWordsEffectsRaw.split('\r\n');
} else {
  commonWords.effects = commonWordsEffectsRaw.split('\n');
}

if (commonWordsNamesRaw.includes('\r')) {
  commonWords.names = commonWordsNamesRaw.split('\r\n');
} else {
  commonWords.names = commonWordsNamesRaw.split('\n');
}



module.exports = {
  spellCheck: (testWord, type) => {
    let corrections = [];
    
    for (let word of commonWords[type]) {
      let dist = utils.levensDist(testWord, word);
      corrections.push([word, dist]);
      if (dist === 0) break;
    }

    if (corrections.length === 0) return null;
    
    corrections.sort((a, b) => a[1] - b[1]);
    return corrections[0][0];
  }
}



