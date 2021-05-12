// Create an instance of a db object for us to store the open database in
var db;

window.onload = function() {
  // Open our database; it is created if it doesn't already exist
  // // (see onupgradeneeded below)
  let request = window.indexedDB.open('products_db', 1);

  // onerror handler signifies that the database didn't open successfully
  request.onerror = function() {
    console.log('Database failed to open');
  } 

  // onsuccess handler signifies that the database opened successfully
  request.onsuccess = function() {
    console.log('Database opened successfully');

    // Store the opened database object in the db variable. This is used a lot below
    db = request.result;

    // Run the displayData() function to display the notes already in the IDB
    displayData();
  }

  // Setup the database tables if this has not already been done
  request.onupgradeneeded = function(e) {
    // Grab a reference to the opened database
    let db = e.target.result;

    // Create an objectStore to store our notes in (basically like a single table)
    // including a auto-incrementing key
    let objectStore = db.createObjectStore('products_os', {keyPath: 'id', autoIncrement: true});

    // Define what data items the objectStore will contain
  }
}

var products;

let product1 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/1');
let product2 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/2');
let product3 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/3');
let product4 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/4');

Promise.all([product1, product2, product3, product4]).then(function(values) {
  console.log(values);
});
