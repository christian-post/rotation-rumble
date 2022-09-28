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

  if (displayAs === undefined) {
    // default is images
    displayAs = 'images';
  }

  let cards = [];

  // table columns
  let head = [
    'Name', 'Card Type', 'Color', 'DMG', 'DEF','Type 1',
    'Type 2', 'Hire', 'Fire'
  ];

  // arrows that indicate the sorting order (used in the HTML table)
  arrow = {
    true: '&#x25B2',
    false: '&#x25BC'
  };

  // all start off as "reverse=false"
  let orderSymbols = new Array(head.length).fill(arrow[false]);


  // DB request

  db.collection('all-cards')
    .find()
    .sort({ name: 1 })
    .forEach(card => {
      cards.push(card);
    })
    .then(()=> {
        res.render(`pages/gallery`, {
          header: 'All Cards',
          cards: cards,
          query: req.query,
          head: head,
          orderSymbols: orderSymbols
        });
    });
});



// card gallery page
app.get('/deckbuilder', (req, res) => {
  if (!db) {
    // database connection not established
    res.render('pages/error');
  }

  let cards = [];

  // table columns
  let head = [
    'Name', 'Card Type', 'Color', 'DMG', 'DEF','Type 1',
    'Type 2', 'Hire', 'Fire'
  ];

  // arrows that indicate the sorting order (used in the HTML table)
  arrow = {
    true: '&#x25B2',
    false: '&#x25BC'
  };

  // all start off as "reverse=false"
  let orderSymbols = new Array(head.length).fill(arrow[false]);

  // DB request

  db.collection('all-cards')
    .find()
    .sort({ name: 1 })
    .forEach(card => {
      cards.push(card);
    })
    .then(()=> {
        res.render(`pages/deck-builder`, {
          header: 'All Cards',
          cards: cards,
          head: head,
          orderSymbols: orderSymbols
        });
    });
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

      // TODO Kartentext rechts neben dem Bild statt darunter

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
      res.render('pages/gallery', {
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
  // TODO: provisorisch...

  // color ist entweder ein String oder ein Array
  let colors = "";
  if (req.body.color) {
    if (typeof req.body.color === 'string') {
      colors = RegExp(escapeRegex(req.body.color), 'i');
    } else {
      if (req.body.color_compare === 'or') {
        colors = RegExp(req.body.color.join("|"), "i");
      } else {
        // AND
        searchStr = '';
        req.body.color.forEach(color => searchStr += `(?=.*${color})`);
        colors = RegExp(searchStr, 'i');
      }
    }
  }

  // dmg und def any value
  // TODO: geht das nicht eleganzer?
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
      res.render(`pages/gallery`, {
        header: `${(found.length ? `These ${found.length}` : "No")} cards matched your search.`,
        cards: found,
        query: {
          as: 'images'
        }
      });
    });
}); 