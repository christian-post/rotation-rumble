import '/FileSaver.js';

// https://muhimasri.com/blogs/how-to-export-html-table-to-a-csv-file/

export const exportCSV = function(id) {
  //TODO outdated
  let csv = [];
  
  const separator = ';';

  const table = document.getElementById(id);

  const rows = table.querySelectorAll("tr"); 
  for (const row of rows.values()) {
      const cells = row.querySelectorAll("td, th");
      const rowText = Array.from(cells).map(cell => cell.innerText);
      csv.push(rowText.join(separator));
  }

  // add money from number input
  const money = document.getElementById('num-money').value;
  csv.push(`Money${separator}${money}`);

  const csvFile = new Blob([csv.join('\n')], {type: "text/csv;charset=utf-8;"});
  saveAs(csvFile, "my-deck.csv");
}


function getInnerText(node) {
  // helper function for the table sorting algorithm

  // TODO has this to be in 2 different places?

  if (node === undefined) {
    return null;
  }

  let childNodes = node.childNodes;

  let textContent = '';
  for(var i = 0; i < childNodes.length; i++) {
      if(childNodes[i].nodeType==3) {
        textContent += childNodes[i].data;
      } else if (childNodes[i].nodeType==1) {
        textContent += getInnerText(childNodes[i]);
      }
  }
  // replace line breaks, single tabs, and whitespace > length 2
  textContent = textContent.replace(/\r?\n|\r|\t|\s{2,}/g,"");
  return textContent;
}


export const exportDeckTxt = function(id) {
  let txt = '';

  // get leader name
  const leader = getInnerText(document.getElementById('leader-container-table').getElementsByTagName('td')[0]);

  if (leader === null) {
    alert('Your deck has to have a Leader!');
    return;
  }

  txt += `//Leader\n${leader}\n\n//Deck\n`;

  const table = document.getElementById(id);

  const rows = table.querySelectorAll(".card-gallery-row"); 
  for (let i = 0; i < rows.length; i++) {
      const cardName = getInnerText(rows[i].children.item(0));
      txt += `1 ${cardName}\n`;
  }

  // add money from number input
  const money = document.getElementById('num-money').value;
  txt += `${money} Money`;

  // deck legality check (rows.length starting at one and the leader cancel out)
  let numCards = rows.length + parseInt(money);
  if (numCards < 45) {
    alert(`Your deck doesn\'t have enough cards (${numCards}/45)`);
    return;
  }

  const txtFile = new Blob([txt], {type: "text/csv;charset=utf-8;"});
  saveAs(txtFile, "my-deck.txt");
}
