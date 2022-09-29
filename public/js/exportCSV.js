import '/FileSaver.js';

// https://muhimasri.com/blogs/how-to-export-html-table-to-a-csv-file/

export const exportCSV = function(id) {
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
  let childNodes = node.childNodes;

  let textContent = '';
  for(var i = 0; i < childNodes.length; i++) {
      if(childNodes[i].nodeType==3) {
        textContent += childNodes[i].data;
      } else if (childNodes[i].nodeType==1) {
        textContent += getInnerText(childNodes[i]);
      }
  }
  textContent = textContent.replace(/\r?\n|\r/g,"");
  textContent = textContent.replace(/\s/g, "");  // whitespace
  // TODO: Don't remove whitespace in Names
  return textContent;
}


export const exportTxt = function(id) {
  let txt = '';

  // get leader
  const leader = getInnerText(document.getElementById('leader-container-table').getElementsByTagName('td')[0]);

  txt += `//Commander\n${leader}\n\n//Deck\n`;

  const table = document.getElementById(id);

  const rows = table.querySelectorAll("tr"); 
  for (let i = 1; i < rows.length; i++) {
      const cardName = getInnerText(rows[i].children.item(0));
      console.log(rows[i].children.item(0))
      txt += `1 ${cardName}\n`;
  }

  // add money from number input
  const money = document.getElementById('num-money').value;
  txt += `${money} Money`;

  const txtFile = new Blob([txt], {type: "text/csv;charset=utf-8;"});
  saveAs(txtFile, "my-deck.txt");
}