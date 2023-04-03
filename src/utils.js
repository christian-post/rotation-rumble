const sanitize = function(text) {
  return text.replace(/[\W_]+/g, ' ');
}


const escapeRegex = function(text) {
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


module.exports = {
  sanitize,
  escapeRegex,
  allCombinations,
  capitalize
};