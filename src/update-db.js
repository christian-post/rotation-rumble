const https = require('https');
require("dotenv").config();


// TODO: korrekte URL rausfinden

const options = {
  hostname: process.env.GOOGLEDOCAPI,
  method: 'GET',
  headers: {
    client_id: process.env.GOOGLECLIENTID,
    client_secret: process.env.GOOGLECLIENTSECRET
  }
};


const res = https.request(options, (res) => {
  console.log(res)
})