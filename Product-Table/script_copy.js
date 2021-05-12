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

async function fetch_products(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function add_product(db, data) {
  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['products_os'], 'readwrite');
    transaction.oncomplete = resolve;
    transaction.onerror = reject;
    const store = transaction.objectStore('products_os');
    data.forEach(function(value) {
      let newItem = {
        title: value.productInfoList[0].productBaseInfoV1.title,
        price: value.productInfoList[0].productBaseInfoV1.flipkartSellingPrice.amount,
        inStock: value.productInfoList[0].productBaseInfoV1.inStock,
      };

      // Make a request to add our newItem object to the object store
      store.put(newItem);
    });
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

function render_product(db, product, index) {
  // Get a reference to table
  let table = document.querySelector('#idb-table');

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

  /* Configure add button */
  let tdAdd = document.createElement('td');
  tdAdd.setAttribute('align', 'center');
  let addButton = document.createElement('button');
  addButton.setAttribute('data-id', ++index);
  tdAdd.appendChild(addButton);
  addButton.textContent = 'Add';
  addButton.onclick = partial(handle_add_click, db);

  tableRow.appendChild(tdAdd);
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

function get_cart_products(db, e) {
  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['products_os'], 'readonly');
    const store = transaction.objectStore('products_os');
    const key = +e.target.getAttribute('data-id');
    const request = store.get(key);
    request.onsuccess = function(event) {
      const product = request.result;
      resolve(product);
    }
    request.onerror = function(event) {
      reject(request.error);
    }
  });
}

function render_cart_product(product, db, e) {
  let table = document.querySelector('#idb-cart');

  const key = +e.target.getAttribute('data-id');

  // If there is still another data item to iterate through, keep running this code
  // Insert into table, tr and td to put each data item inside when displaying it
  // structure the HTML fragment, and append it inside the table
  let tableRow = document.createElement('tr');
  tableRow.setAttribute('data-id', key);
  for (let val in product) {
    if (Object.prototype.hasOwnProperty.call(product, val)) {
      if (val !== 'id' && val !=='inStock') {
        let td = document.createElement('td');
        tableRow.appendChild(td);
        td.textContent = product[val];
      }
    }
  }

  /* Configure Qty */
  let tdQty = document.createElement('td');
  tableRow.appendChild(tdQty);
  tdQty.textContent = 1;

  /* Configure delete button */
  let tdDelete = document.createElement('td');
  tdDelete.setAttribute('align', 'center');
  let deleteButton = document.createElement('button');
  tdDelete.appendChild(deleteButton);
  deleteButton.textContent = 'Delete';
  deleteButton.onclick = partial(handle_delete_click, db);

  tableRow.appendChild(tdDelete);
  table.appendChild(tableRow);
}

function increment_qty(db, e) {
  return new Promise (function(resolve, reject) {
    const transaction = db.transaction(['cart_os'], 'readwrite');
    const store = transaction.objectStore('cart_os');
    const key = +e.target.getAttribute('data-id');
    const index = store.index('title');
    const title = e.target.closest('tr').firstElementChild.textContent;
    const request = index.get(title);
    request.onsuccess = function(event) {
      // Get the old value that we want to update
      const product = event.target.result;

      // update the quantity in the object
      product.quantity =  product.quantity + 1;

      console.log('The object passed to put is %o', product)
      // Put this updated object back into the database.
      const requestUpdate = store.put(product);

      requestUpdate.onerror = function(event) {
        // Do something with the error
      };

      requestUpdate.onsuccess = function(event) {
        let idbCart = document.getElementById('idb-cart');
        let targetTr = idbCart.querySelector(`[data-id='${key}'`);

        targetTr.querySelector(':nth-child(3)').textContent = +targetTr.querySelector(':nth-child(3)').textContent + 1;
      };
    }
    request.onerror = function(event) {
      reject(request.error);
    }
  });
}

async function handle_add_click(db, e) {
  let items = e.target.parentElement.parentElement.querySelectorAll(':not(:last-child)');

  let newItem = {title: items[0].textContent, price: items[1].textContent, quantity: 1};

  const product = await get_cart_products(db, e);

  const key = +e.target.getAttribute('data-id');
  var idbCartRows = document.getElementById('idb-cart').querySelectorAll('tr');
  //if(!idbCartRows.length) return render_cart_product(product, db, e);
  let cartTableHasRow = idbCartRows.some(function(each) {
    return each.getAttribute('data-id') == product.id; 
  })

  if(cartTableHasRow) {
    await increment_qty(db, e);
  } else {
    await add_to_cart(newItem, db);
    render_cart_product(product, db, e);
  };
}

async function handle_delete_click(db, e) {
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

  let cartStore = db.createObjectStore('cart_os', {keyPath: 'id', autoIncrement: true});

  // Define what data items the cart objectStore will contain
  cartStore.createIndex('title', 'title', {unique: false});
  cartStore.createIndex('price', 'price', {unique: false});
  cartStore.createIndex('quantity', 'quantity', {unique: false});
}

async function onload() {
  const product  = await Promise.all([
    fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/1'),
    fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/2'),
    fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/3'),
    fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/4'),
  ]);


  const db = await open('products_db', 1, onupgradeneeded_version1);
  await add_product(db, product);

  const products = await get_products(db);

  for (let [index, product] of products.entries()) {
    render_product(db, product, index);
  }
}

window.onload = onload();
