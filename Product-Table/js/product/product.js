NodeList.prototype.some = function (callback) {
  return Array.prototype.some.call(this, callback);
}

var PRODUCT = (function(partial, proto, cart) {

  async function handle_add_click(db, e) {
    let items = e.target.parentElement.parentElement.querySelectorAll(':not(:last-child)');

    let newItem = {title: items[0].textContent, price: items[1].textContent, quantity: 1};

    const product = await cart.get(db, e);

    const key = +e.target.getAttribute('data-id');
    var idbCartRows = document.getElementById('idb-cart').querySelectorAll('tr');
    let cartTableHasRow = idbCartRows.some(function(each) {
      return each.getAttribute('data-id') == product.id; 
    })

    if(cartTableHasRow) {
      await cart.increment_qty(db, e);
    } else {
      await cart.add(newItem, db);
      cart.render(product, db, e);
    };
  }

  let add = function(db, data) {
    return new Promise (function(resolve, reject) {
      const transaction = db.transaction(['products_os'], 'readwrite');
      transaction.oncomplete = resolve;
      transaction.onerror = reject;
      const store = transaction.objectStore('products_os');
      data.forEach(function(value) {
        let newItem = {
          //title: value.productInfoList[0].productBaseInfoV1.title,
          //price: value.productInfoList[0].productBaseInfoV1.flipkartSellingPrice.amount,
          //inStock: value.productInfoList[0].productBaseInfoV1.inStock,
          title: "Hard Coded Title",
          price: "Hard Coded price",
          inStock: "Hard Coded inStock",
        };

        // Make a request to add our newItem object to the object store
        store.put(newItem);
      });
    });
  }

  let get = function(db) {
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

  let render = function(db, product, index) {
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

  return {
    add,
    get,
    render,
  }
})(PARTIAL, PROTO, CART);
