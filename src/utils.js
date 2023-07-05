const sanitize = function(text, replacement=' ') {
  if (text === undefined) return '';
  return text.replace(/[\W_]+/g, replacement);
}


const escapeRegex = function(text) {
  if (text === undefined) return '';
  // helper function
  // https://stackoverflow.com/questions/38421664/fuzzy-searching-with-mongodb
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};


const allCombinations = function(items) {
  // https://code-boxx.com/javascript-permutations-combinations/
  let results = [];
  for (let slots = items.length; slots > 0; slots--) {
    for (let loop = 0; loop < items.length - slots + 1; loop++) {
      let key = results.length;
      results[key] = [];
      for (let i = loop; i < loop + slots; i++) {
        results[key].push(items[i]);
      }
    }
  }
  return results;
}


const capitalize = function(str) {
  // capitalize the first char of a string
  return str.charAt(0).toUpperCase() + str.slice(1);
}


const levensDist = function(s, t) {
  const m = s.length;
  const n = t.length;

  let d = [];
  for (let i = 0; i < m + 1; i++) {
    d.push(Array(n + 1).fill(0));
  }

  for (let i = 1; i < m + 1; i++) {
    d[i][0] = i;
  }

  for (let j = 1; j < n + 1; j++) {
    d[0][j] = j;
  }

  for (let j = 1; j < n + 1; j++) {
    for (let i = 1; i < m + 1; i++) {
      let cost = (s[i - 1] === t[j - 1]) ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  return d[m][n]
}


module.exports = {
  sanitize,
  escapeRegex,
  allCombinations,
  capitalize,
  levensDist
};