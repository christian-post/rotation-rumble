/* 
Node script that converts a CSV file to a JSON file for NoSQL databases (both server sided)
*/

const fs = require('fs');
const Papa = require('papaparse');

const FPATH = './data/csv/Rotation_Rumble_All_Cards_Fighter.csv';
let cardDataString = fs.readFileSync(FPATH, { encoding: 'utf8', flag: 'r' });

const cardData = Papa.parse(cardDataString, { header: true, delimiter: ',' });

fs.writeFileSync('./data/json/all_cards_fighter.json', JSON.stringify(cardData.data));