// Create an instance of a db object for us to store the open database in
let db;

window.onload = function() {
  // Open our database; it is created if it doesn't already exist
  // (see onupgradeneeded below)
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
    fetchProducts();
    //displayData();
  }

  // Setup the database tables if this has not already been done
  request.onupgradeneeded = function(e) {
    // Grab a reference to the opened database
    let db = e.target.result;

    // Create an objectStore to store our products in (basically like a single table)
    // including a auto-incrementing key
    let objectStore = db.createObjectStore('products_os', {keyPath: 'id', autoIncrement: true});

    // Define what data items the objectStore will contain
    objectStore.createIndex('title', 'title', {unique: false});
    objectStore.createIndex('price', 'price', {unique: false});
    objectStore.createIndex('inStock', 'inStock', {unique: false});

    // Create a cart objectStore
    let cartStore = db.createObjectStore('cart_os', {keyPath: 'idi', autoIncrement: true});

    // Define what data items the cart objectStore will contain
    cartStore.createIndex('title', 'title', {unique: false});
    cartStore.createIndex('price', 'price', {unique: false});
  }

  function fetchProducts() {
    var products;

    let product1 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/1')
      .then(function(response) {
        return response.json();
      })
    //   .then(function(myJson) {
    //     console.log(JSON.stringify(myJson));
    // });
    let product2 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/2').then(response => response.json());
    let product3 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/3').then(response => response.json());
    let product4 = fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/4').then(response => response.json());

    Promise.all([product1, product2, product3, product4]).then(function(values) {
      addData(values);
    });
  }

  function addData(values) {
    // prevent default - we don't want the form to submit in the conventional way
    //e.preventDefault();

    // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
    console.log(values);

    // open a read/write db transaction, ready for adding the data
    let transaction = db.transaction(['products_os'], 'readwrite');


    // call an object store that's already been added to the database
    let objectStore = transaction.objectStore('products_os');

    values.forEach(function(value) {
      let newItem = {
        title: value.productInfoList[0].productBaseInfoV1.title,
        price: value.productInfoList[0].productBaseInfoV1.flipkartSellingPrice.amount,
        inStock: value.productInfoList[0].productBaseInfoV1.inStock,
      };

      // Make a request to add our newItem object to the object store
      var request = objectStore.add(newItem);
    });

    transaction.oncomplete = function() {
      console.log('Transaction completed: database modification finished.');

      // update the display of data to show the newly added item, by running displayData() again.
      displayData();
    }

    transaction.onerror = function() {
      console.log('Transaction not opened due to error');
    };
  }

  function displayData() {
    // Open our object store and then get a cursor - which iterates through all the
    // different data items in the store
    let objectStore = db.transaction('products_os').objectStore('products_os');
    objectStore.openCursor().onsuccess = function(e) {
      // Get a reference to the cursor
      let cursor = e.target.result;

      // Get a reference to table
      let table = document.querySelector('#idb-table');

      // If there is still another data item to iterate through, keep running this code
      if(cursor) {
        // Insert into table, tr and td to put each data item inside when displaying it
        // structure the HTML fragment, and append it inside the table
        let tableRow = document.createElement('tr');
        for (let val in cursor.value) {
          if (Object.prototype.hasOwnProperty.call(cursor.value, val)) {
            if (val !== 'id') {
              let td = document.createElement('td');
              tableRow.appendChild(td);
              td.textContent = cursor.value[val];
            }
          }
        }
        let td = document.createElement('td');
        td.setAttribute('align', 'center');
        let addButton = document.createElement('button');
        td.appendChild(addButton);
        addButton.textContent = 'Add';
        addButton.addEventListener('click', function(e) {
          addCartData(e);
        })
        tableRow.appendChild(td);
        table.appendChild(tableRow);

        // Iterate to the next item in the cursor
        cursor.continue();
      }
    }
  }

  function addCartData(e) {
    let req = window.indexedDB.open('products_db', 2);

    req.onerror = function() {
      console.log('Database failed to open');
    } 

    req.onsuccess = function() {
      console.log('Database opened successfully');

      // Store the opened database object in the db variable. This is used a lot below
      db = request.result;

      // Run the displayData() function to display the notes already in the IDB
      fetchProducts();
      //displayData();
    }

    req.onblocked = function(event) {
      // If some other tab is loaded with the database, then it needs to be closed
      // before we can proceed.
      alert("Please close all other tabs with this site open!");
      };

    req.onupgradeneeded = function(e){
      var db = e.target.result;
      console.log(db);
    }

    let items = e.target.parentElement.parentElement.querySelectorAll(':not(:last-child)');

    let newItem = {title: items[0].textContent, price: items[1].textContent};

    // open a read/write db transaction, ready for adding the data
    let transaction = db.transaction(['cart_os'], 'readwrite');

    // call an object store that's already been added to the database
    let objectStore = transaction.objectStore('cart_os');

    // Make a request to add our newItem object to the object store
    var request = objectStore.add(newItem);
  }
}
