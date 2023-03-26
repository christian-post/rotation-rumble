const express = require('express');
const { connectToDb, getDb } = require('./db');
const { body, validationResult } = require('express-validator');
const path = require('path');
require("dotenv").config();


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


// -- routes --
// TODO: create Router folder

// GET requests

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


// POST requests

const sanitize = function(text) {
  // TOTO Do I need this?
  return text.replace(/'[.\\+*?\\[^\]$(){}=!<>|:\\#'"]/g, '\\$0');
}


const escapeRegex = function(text) {
  // helper function
  // https://stackoverflow.com/questions/38421664/fuzzy-searching-with-mongodb
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


app.post('/simple-search/', (req, res) => {
  if (req.body.search_field) {
    const regex = new RegExp(escapeRegex(req.body.search_field), 'i');

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


function allCombinations (items) {
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
  
  

app.post('/advanced-search/', (req, res) => {
  
  let colors = "";
  if (req.body.color) {
    // color ist entweder ein String oder ein Array
    if (typeof req.body.color === 'string') {
      if (req.body.color_compare === 'exact' || req.body.color_compare === 'most') {
        colors = RegExp(`^${req.body.color}$`, 'i');
      } else if (req.body.color_compare === 'least-one' || req.body.color_compare === 'include-all') {
        colors = RegExp(escapeRegex(req.body.color), 'i');
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

        let combo = allCombinations(req.body.color);
        combo.forEach(comb => {
          searchStr += comb.join('\/') + '|';
        });

        searchStr += ')$';
        colors = RegExp(searchStr, 'i');
      }
    }
  }

  // dmg und def any value
  // TODO: geht das nicht eleganter?
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

  // Dice
  if (req.body.dice === 'Irrelevant') {
    req.body.dice = /(?:)/i;
  }

  const search = {
    name: RegExp(escapeRegex(req.body.name), 'i'),
    cardtype: RegExp(escapeRegex(req.body.cardtype), 'i'),
    color: colors || /(?:)/i,

    dmg: { [req.body.dmg_compare_method]:  req.body.dmg },
    def: { [req.body.def_compare_method]:  req.body.def },
    
    dice: req.body.dice || /(?:)/i,

    $and: [
        { 
      $or: [
          { type1: RegExp(escapeRegex(req.body.type), 'i') },
          { type2: RegExp(escapeRegex(req.body.type), 'i') }
      ]
      },
        { 
      $or: [
          { effect1: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { effect2: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { effect3: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { effect4: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { step1: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { step2: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { step3: RegExp(escapeRegex(req.body.effectOrStep), 'i') },
          { step4: RegExp(escapeRegex(req.body.effectOrStep), 'i') }
          ]
      }
    ]
  }; 

  console.log(search)

  found = [];
  db.collection('all-cards')
  .find(search)
  .forEach(card => {
    found.push(card);
  })
  .then(()=> {
    res.render(`pages/search-results`, {
      header: `${(found.length ? `These ${found.length}` : "No")} cards matched your search.`,
      cards: found,
      query: {
        as: 'images'
      }
    });
  });
}); 