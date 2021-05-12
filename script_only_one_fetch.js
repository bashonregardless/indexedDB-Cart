function partial(func, ...args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  }
}

function open(name, version, onupgradeneeded) {
  return new Promise (function executor(resolve, reject) {
    const request  = indexedDB.open(name, version); 
    request.onsuccess = function(event) {
      resolve(request.result);
    };

    request.onerror = function(event) {
      reject(request.result);
    };

    request.onblocked = function(event) {
      console.log('Please close all other open connection with this db!');
    }

    request.onupgradeneeded = onupgradeneeded;
  })
}

async function fetch_products() {
  const response = await fetch('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/1');
  const data = await response.json();
  return data;
}

function add_product(db, data) {
  let newItem = {
    title: data.productInfoList[0].productBaseInfoV1.title,
    price: data.productInfoList[0].productBaseInfoV1.flipkartSellingPrice.amount,
    inStock: data.productInfoList[0].productBaseInfoV1.inStock,
  };

  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['products_os'], 'readwrite');
    transaction.oncomplete = resolve;
    transaction.onerror = reject;
    const store = transaction.objectStore('products_os');
    store.put(newItem);
  });
}

function get_products(db) {
  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['products_os'], 'readonly');
    const store = transaction.objectStore('products_os');
    const request = store.getAll();
    request.onsuccess = function(event) {
      const products_array = request.result;
      resolve(products_array);
    }
    request.onerror = function(event) {
      reject(request.error);
    }
  });
}

function render_product(db, product) {
  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store

  // Get a reference to table
  let table = document.querySelector('#idb-table');

  // If there is still another data item to iterate through, keep running this code
  // Insert into table, tr and td to put each data item inside when displaying it
  // structure the HTML fragment, and append it inside the table
  let tableRow = document.createElement('tr');
  for (let val in product) {
    if (Object.prototype.hasOwnProperty.call(product, val)) {
      if (val !== 'id') {
        let td = document.createElement('td');
        tableRow.appendChild(td);
        td.textContent = product[val];
      }
    }
  }
  let td = document.createElement('td');
  td.setAttribute('align', 'center');
  let addButton = document.createElement('button');
  td.appendChild(addButton);
  addButton.textContent = 'Add';
  addButton.onclick = partial(handle_click, db);
  tableRow.appendChild(td);
  table.appendChild(tableRow);
}

function add_to_cart(product, db) {
  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['cart_os'], 'readwrite');
    transaction.oncomplete = resolve;
    transaction.onerror = reject;
    const store = transaction.objectStore('cart_os');
    store.put(product);
  });
}

async function handle_click(db, e) {
  let items = e.target.parentElement.parentElement.querySelectorAll(':not(:last-child)');

  let newItem = {title: items[0].textContent, price: items[1].textContent};

  await add_to_cart(newItem, db);
}


function onupgradeneeded_version1(e) {
  // Grab a reference to the opened database
  let db = e.target.result;

  // Create an objectStore to store our products in (basically like a single table)
  // including a auto-incrementing key
  let objectStore = db.createObjectStore('products_os', {keyPath: 'id', autoIncrement: true});

  // Define what data items the objectStore will contain
  objectStore.createIndex('title', 'title', {unique: false});
  objectStore.createIndex('price', 'price', {unique: false});
  objectStore.createIndex('inStock', 'inStock', {unique: false});

  let cartStore = db.createObjectStore('cart_os', {keyPath: 'idi', autoIncrement: true});

  // Define what data items the cart objectStore will contain
  cartStore.createIndex('title', 'title', {unique: false});
  cartStore.createIndex('price', 'price', {unique: false});
}

async function onload() {
  const product  = await fetch_products();
  const db = await open('products_db', 1, onupgradeneeded_version1);
  await add_product(db, product);

  const products = await get_products(db);

  for (const product of products) {
    render_product(db, product);
  }
}

window.onload = onload();

