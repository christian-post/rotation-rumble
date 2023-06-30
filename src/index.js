const express = require('express');
const { connectToDb, getDb } = require('./db');
const utils = require('./utils');
const { body, validationResult } = require('express-validator');
const path = require('path');
require("dotenv").config();
const fs = require('fs');
const util = require('util');  // for logging purposes


const app = express()
  .use(express.static('public'))
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .use(express.urlencoded({ extended: true }))
  .use(express.json());


let db;

connectToDb(err => {
  if (err) {
    console.log(err);
    // return;
  }

  let port = process.env.PORT || 3000;

  app.listen(port, ()=> {
    console.log(`App listening on port ${port}`);

    db = getDb();
  });
});


// info about files in the /decks/ directory
let decks = fs.readdirSync('./public/decks/');

// https://stackoverflow.com/a/62953551/12251941
app.use((req, res, next) => {
  res.locals.decks = decks;
  next();
});


// -- routes --
// TODO: create Router folder

// --------- GET requests ------------------------------------------------------

// index Page (simple search)
app.get('/', (req, res) => {
  res.render(`pages/index`);
});


// Advanced Search
app.get('/advanced', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  }

  res.render(`pages/advanced`);
});


// card gallery page
app.get('/gallery', (req, res) => {
  // Error handler

  if (!db) {
    // database connection not established
    res.render('pages/error');
  }


  // get display method from url
  let displayAs = req.query.as;
  let groupBy = req.query.group;

  if (displayAs === undefined) {  // TODO: is this even used?
    // default is images
    displayAs = 'images';
  }

  if (groupBy === undefined) {
    // default is None
    groupBy = 'none';
  }


  let cards = [];

  // data fields
  let fields = [
    'name', 'cardtype', 'set', 'color', 'dmg', 'def', 'type1', 
    'type2', 'hire', 'fire'
  ];

  // table column names
  let head = [
    'Name', 'Card Type', 'Set', 'Color', 'DMG', 'DEF','Type 1',
    'Type 2', 'Hire', 'Fire'
  ];

  // arrows that indicate the sorting order (used in the HTML table)
  arrow = {
    true: '&#x25B2',
    false: '&#x25BC'
  };

  // all start off as "reverse=false"
  let orderSymbols = new Array(fields.length).fill(arrow[false]);


  // DB request

  // aggregate based on the groupby argument
  // TODO too much duplicate code

  if (groupBy !== 'none') {
    const pipeline = [
      { $group: { _id: `\$${groupBy}`, count: { $sum: 1 }}},
      {$sort: { _id: 1 }} 
    ];

    const aggCursor = db.collection('all-cards').aggregate(pipeline);
    aggCursor.toArray().then((aggResults) => {
      let sort = {};
      sort[groupBy] = 1;
      sort['name'] = 1;

      db.collection('all-cards')
        .find()
        .sort(sort)
        .forEach(card => {
          cards.push(card);
        })
        .then(()=> {
            res.render(`pages/gallery`, {
              header: 'All Cards',
              cards: cards,
              query: req.query,
              head: head,
              fields: fields,
              orderSymbols: orderSymbols,
              groupBy: groupBy,
              aggregated: aggResults
            });
        });
    });
  } else {
    // no sorting
    db.collection('all-cards')
    .find()
    .sort({ 'name': 1 })
    .forEach(card => {
      cards.push(card);
    })
    .then(()=> {
        res.render(`pages/gallery`, {
          header: 'All Cards',
          cards: cards,
          query: req.query,
          head: head,
          fields: fields,
          orderSymbols: orderSymbols,
          groupBy: groupBy,
          aggregated: undefined
        });
    });
  } 
});


app.get('/deckbuilder', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  } else {
    res.render('pages/deckbuilder');
  }
});


// deck editor
app.get('/deck-editor', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  }

  let deckID = req.query.deck;

  let cards = [];

  // data fields
  // rudimentary so it fits the screen
  let fields = ['name', 'cardtype', 'hire', 'info'];

  // table column names
  let head = ['Name', 'Card Type', 'Cost', 'Info'];

  // arrows that indicate the sorting order (used in the HTML table)
  arrow = {
    true: '&#x25B2',
    false: '&#x25BC'
  };

  // all start off as "reverse=false"
  let orderSymbols = new Array(fields.length).fill(arrow[false]);

  // DB request
  db.collection('all-cards')
    .find()
    .sort({ name: 1 })
    .forEach(card => {
      // Construct the "Info" cell
      card.info = '💬';

      cards.push(card);
    })
    .then(()=> {
        res.render(`pages/deck-editor`, {
          header: 'All Cards',
          query: { as: 'table' },
          cards: cards,
          head: head,
          fields: fields,
          orderSymbols: orderSymbols,
          deckID: deckID
        });
    });
});


// visualized deck stats
app.get('/visual-deckstats', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  } else {
    res.render(`pages/visual-deckstats`);
  }

});


// about page
app.get('/about', (req, res) => {
  res.render(`pages/about`);
});



// display single card
app.get('/card/:cardname', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  }

  let found = [];

  db.collection('all-cards')
    .find({ id: req.params.cardname})
    .forEach(card => found.push(card))
    .then(()=> {

      let card;

      // TODO: was wenn mehrere Karten gefunden wurden?
      if (found.length > 0) {
        card = found[0];
      } else {
        card = null;
      }

      res.render(`pages/singlecard`, {
        card: card
      });
    });
});

// --- JSON API ------

// whole card database
app.get('/api/all-cards', (req, res) => {
  let cards = [];
  db.collection('all-cards')
    .find()
    .sort({ name: 1 })
    .forEach(card => {
      cards.push(card);
    })
    .then(()=> {
      res.status(200);
      res.json(cards);
    })
    .catch(()=> {
      res.status(500).json({ err: 'Could not fetch the cards.' });
    });
});


// -------------- POST requests ------------------------------------------------

app.post('/simple-search/', (req, res) => {
  if (req.body.search_field) {
    const regex = new RegExp(utils.escapeRegex(req.body.search_field), 'i');

    found = [];
    db.collection('all-cards')
    .find({ "name": regex })
    .forEach(card => {
      found.push(card);
    })
    .then(()=> {
      res.render('pages/search-results', {
        header: `Search results for "${req.body.search_field}":`,
        cards: found, 
        query: {
          as: 'images'
        }
      });
    });
  } else {
    res.render('pages/index');
  }
});
  

app.post('/advanced-search/', (req, res) => {
  // Suche lesbar machen
  let searchExplain = [];
  let attrs = [
    'name', 'cardtype', 'color', 'dmg', 'def', 'dice', 'token', 'type', 
    'effectOrStep', 'set'
  ];

  let aliases = {
    '$eq': 'equal to',
    '$gt': 'greater than',
    '$lt': 'less than',
    '$gte': 'greater than or equal to',
    '$lte': 'less than or equal to',
    'exact': 'is exactly these colors',
    'least-one': 'is at least one of these colors',
    'include-all': 'includes all of these colors',
    'most': 'is at most these colors',
    '{t}': 'Treefolk',
    '{bb}': 'Bomb',
    '{bn}': 'Bones',
    '{by}': 'bury',
    '{c}': 'Coil',
    '{d}': 'Dice',
    '{e}': 'Energy',
    '{hs}': 'Haste',
    '{ht}': 'Heart',
    '{m}': 'Money',
    '{s}': 'Star',
    '{t}': 'Treefolk',
    '{u}': 'unblockable'
  };

  // Info Text for search results
  for (let i = 0; i < attrs.length; i++) {
    if (req.body[attrs[i]]) {
      switch(attrs[i]) {
        case 'color':
          let colorStr = req.body[attrs[i]].toString().replaceAll(',', ', ');
          searchExplain.push(`the Color ${aliases[req.body.color_compare]}: ${colorStr}`);
          break;
        case 'dice':
          if (req.body['dice'] === 'Yes') {
            searchExplain.push('the card requires die rolls');
          } else if (req.body['dice'] === 'No') {
            searchExplain.push('the card doesn\'t require die rolls');
          }
          break;
        case 'dmg':
          if (req.body.dmg === 'any') break;
          searchExplain.push(
            `DMG is ${aliases[req.body.dmg_compare_method]} ${req.body[attrs[i]]}`
            );
          break;
        case 'def':
          if (req.body.def === 'any') break;
          searchExplain.push(
            `DEF is ${aliases[req.body.def_compare_method]} ${req.body[attrs[i]]}`
            );
          break;
        case 'token':
          let tokenText;
          if (typeof req.body.token === 'object') {
            // TODO: logical OR, AND unterscheiden
            tokenText = req.body.token.map(x => aliases[x]).join(', ');
          } else {
            tokenText = aliases[req.body.token];
          }
          searchExplain.push(
            `the card interacts with ${tokenText} tokens`
          );
          break;
        case 'effectOrStep':
          searchExplain.push(`the Effects or Steps contain "${req.body[attrs[i]]}"`);
          break;
        case 'set':
          if (typeof req.body.set === 'object') {
            searchExplain.push(`the Set is "${req.body.set.join('" or "')}"`);
            break;
          }

        default:
          searchExplain.push(`the ${utils.capitalize(attrs[i])} is "${req.body[attrs[i]]}"`);
      }
    }
  }

  // Suche nach Farben
  let colors = '';
  if (req.body.color) {
    // color ist entweder ein String oder ein Array
    if (typeof req.body.color === 'string') {
      if (req.body.color_compare === 'exact' || req.body.color_compare === 'most') {
        colors = RegExp(`^${req.body.color}$`, 'i');
      } else if (req.body.color_compare === 'least-one' || req.body.color_compare === 'include-all') {
        colors = RegExp(utils.escapeRegex(req.body.color), 'i');
      }
    } else {
      if (req.body.color_compare === 'exact') {
        colors = RegExp(`^${req.body.color.join('/')}$`, 'i');
      } else if (req.body.color_compare === 'least-one') {
        // logical OR
        colors = RegExp(req.body.color.join('|'), 'i');
      } else if (req.body.color_compare === 'include-all') {
        // logical AND
        let searchStr = '';
        req.body.color.forEach(color => searchStr += `(?=.*${color})`);
        colors = RegExp(searchStr, 'i');
      } else {
        // "most"
        let searchStr = '^(';

        let combo = utils.allCombinations(req.body.color);
        combo.forEach(comb => {
          searchStr += comb.join('\/') + '|';
        });

        searchStr += ')$';
        colors = RegExp(searchStr, 'i');
      }
    }
  }

  // Suche nach Token
  let tokens = '';
  if (req.body.token) {
    // color ist entweder ein String oder ein Array
    if (typeof req.body.token === 'string') {

      if (req.body.token_compare === 'exact') {
        //  TODO: das ergibt noch keinen Sinn
        tokens = RegExp(req.body.token, 'i');
      } else if (
          req.body.token_compare === 'least-one' ||
          req.body.token_compare === 'include-all'
        ) {
        tokens = RegExp(utils.escapeRegex(req.body.token), 'i');
      }

    } else {
      if (req.body.token_compare === 'exact') {
        tokens = RegExp(`^${req.body.token.join('/')}$`, 'i');
      } else if (req.body.token_compare === 'least-one') {
        // logical OR
        tokens = RegExp(req.body.token.join('|'), 'i');
      } else if (req.body.token_compare === 'include-all') {
        // logical AND
        let searchStr = '';
        req.body.token.forEach(token => searchStr += `(?=.*${token})`);
        tokens = RegExp(searchStr, 'i');
      }
    }
  } else {
    tokens = /(?:)/i;
  }

  // dmg und def any value
  // TODO: don't change the contents of req.body; make a new variable for each
  if (req.body.dmg === 'any') {
    req.body.dmg = /(?:)/i;
    req.body.dmg_compare_method = '$regex';
  }
  if (req.body.def === 'any') {
    req.body.def = /(?:)/i;
    req.body.def_compare_method = '$regex';
  }

  if (req.body.dmg_compare_method === '$not') {
    req.body.dmg = RegExp(req.body.dmg, 'i');
  }
  if (req.body.def_compare_method === '$not') {
    req.body.def = RegExp(req.body.def, 'i');
  }


  // Würfel
  if (req.body.dice === 'Irrelevant') {
    req.body.dice = /(?:)/i;
  }


  // Types
  let typeSearch = utils.sanitize(req.body.type, '');
  let types = typeSearch.split('\ ');
  if (types.length > 1) {
    req.body.type = RegExp(types.join('|'), 'i');
  } else {
    req.body.type = RegExp(utils.escapeRegex(typeSearch));
  }
  console.log(`type: "${req.body.type}"`)


  // Effects or Steps
  let effectsSearchStr = utils.sanitize(req.body.effectOrStep).trim();
  let effectSearch;
  if (req.body.effectOrStep_exact) {
    effectSearch = `\"${effectsSearchStr}\"`;
  } else if (req.body.effectOrStep_matchall) {
    effectSearch = `\"${effectsSearchStr.replaceAll(' ', '\" \"')}\"`;
  } else {
    effectSearch = effectsSearchStr;
  }
  console.log(`effects: "${effectSearch}"`)


  // Set
  let setSearchStr;
  let sets;
  if (typeof req.body.set === 'string') {
    setSearchStr = req.body.set;
  } else {
    // Array
    setSearchStr = `${req.body.set.join('|')}`;
  }
  sets = RegExp(setSearchStr, 'i');


  // Regex and query formatting
  const search = {
    name: RegExp(utils.escapeRegex(req.body.name), 'i'),
    cardtype: RegExp(utils.escapeRegex(req.body.cardtype), 'i'),
    color: colors || /(?:)/i,

    dmg: { [req.body.dmg_compare_method]:  req.body.dmg },
    def: { [req.body.def_compare_method]:  req.body.def },
    
    dice: req.body.dice || /(?:)/i,
    set: sets,

    $and: [
      { 
        $or: [
            { type1: req.body.type },
            { type2: req.body.type }
        ]
      },
      {
        $or: [
          { effect1: tokens },
          { effect2: tokens },
          { effect3: tokens },
          { effect4: tokens },
          { step1: tokens },
          { step2: tokens },
          { step3: tokens },
          { step4: tokens }
        ]
      }
    ]
  }; 

  if (effectSearch) {
    search['$text'] = { $search: effectSearch };
  }

  console.log(util.inspect(search, {showHidden: false, depth: null, colors: true}));


  var header;
  found = [];
  db.collection('all-cards')
    .find(search)
    .forEach(card => {
      found.push(card);
    })
    .then(()=> {
      // header string
      if (found.length === 1) {
        header = `This card matched your search`;
      } else if (found.length > 1) {
        header = `These ${found.length} cards matched your search`;
      } else {
        header = 'No cards matched your search';
      }

      if (searchExplain.length > 0) {
        header += ' where ' + searchExplain.join(', and where ');
      }
      header += '.';
      
      res.render('pages/search-results', {
        header: header,
        cards: found,
        query: {
          as: 'images'
        }
      });
    });
}); 