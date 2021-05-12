/* Taken from mdn How_to_build_custom_form_widgets */
var PROTO = {
  forEach() {
    NodeList.prototype.forEach = function (callback) {
      return Array.prototype.forEach.call(this, callback);
    }
  },

  some() {
    NodeList.prototype.some = function (callback) {
      return Array.prototype.some.call(this, callback);
    }
  }
}
