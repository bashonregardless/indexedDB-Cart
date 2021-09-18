window.onload = (async function() {
  async function fetch_products(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
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

  const product  = await Promise.all([
    //fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/1'),
    //fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/2'),
    //fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/3'),
    //fetch_products('http://localhost:3001/fK/affiliate-api.flipkart.net/affiliate/products/4'),
	Promise.resolve("Resolved! Never bother parameter")
  ]);

  const db = await open('products_db', 1, onupgradeneeded_version1);

  await PRODUCT.add(db, product);

  const products = await PRODUCT.get(db);

  for (let [index, product] of products.entries()) {
    PRODUCT.render(db, product, index);
  }
})();
