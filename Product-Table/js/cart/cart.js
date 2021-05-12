var CART = (function(partial) {
  function increment_qty(db, e) {
    return new Promise (function(resolve, reject) {
      const key = +e.target.getAttribute('data-id');
      const title = e.target.closest('tr').firstElementChild.textContent;

      const transaction = db.transaction(['cart_os'], 'readwrite');
      const store = transaction.objectStore('cart_os');
      const index = store.index('title');
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

          const transaction = db.transaction(['cart_os'], 'readonly');
          const store = transaction.objectStore('cart_os');
          const index = store.index('title');
          const requestQty = index.get(title);

          requestQty.onsuccess = function(event) {
            const product = event.target.result;
            const qty = product.quantity;
            targetTr.querySelector(':nth-child(3)').textContent = qty;
          }
          requestQty.onerror = function(event) {
            console.log('Quantity coud not be updated');
          }
        };
      }
      request.onerror = function(event) {
        reject(request.error);
      }
    });
  }

  async function handle_delete_click(db, e) {

  }

  let add = function(product, db) {
    return new Promise (function(resolve, reject) {
      const transaction = db.transaction(['cart_os'], 'readwrite');
      transaction.oncomplete = resolve;
      transaction.onerror = reject;
      const store = transaction.objectStore('cart_os');
      store.put(product);
    });
  }

  let get = function(db, e) {
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

  let render = function(product, db, e) {
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

  return {
    add,
    get,
    render,
    increment_qty,
  }
})(PARTIAL);
