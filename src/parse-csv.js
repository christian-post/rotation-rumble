/* 
Node script that converts a CSV file to a JSON file for NoSQL databases (both server sided)
*/

const fs = require('fs');
const Papa = require('papaparse');

const FPATH = './data/csv/Rotation_Rumble_All_Cards_Fighter.csv';
let cardDataString = fs.readFileSync(FPATH, { encoding: 'utf8', flag: 'r' });

// replace End of text, multiple whitespaces
let cleanedDataString = cardDataString.replace(//gmi, " ")
  .replace(/[ ]{2,}/gmi, " ");

// console.log(cleanedDataString)

const cardData = Papa.parse(
  cleanedDataString, 
  { header: true, delimiter: ',', skipEmptyLines: 'greedy' }
);

// fs.writeFileSync('./data/csv/test.csv', cleanedDataString);

fs.writeFileSync('./data/json/all_cards_fighter.json', JSON.stringify(cardData.data));