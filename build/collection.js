// Generated by CoffeeScript 1.6.2
var DVLCollection, dvl;

dvl = require('./core');

DVLCollection = (function() {
  function DVLCollection() {
    this._array = [];
    this.blocks = {};
    this._compare = function(a, b) {
      return a === b;
    };
  }

  DVLCollection.prototype.map = function(fn) {
    var that;

    if (this._fn) {
      throw new Error('DVLCollection.map can\'t be called twice');
    }
    that = this;
    this._fn = fn;
    this._array.forEach(function(item, i) {
      return that.blocks[i] = dvl.block(function() {
        return that._fn(item);
      });
    });
    return this.blocks;
  };

  DVLCollection.prototype.compare = function(fn) {
    if (typeof fn === 'function') {
      throw new Error('DVLCollection.compare needs function');
    }
    this._compare = fn;
    return this;
  };

  DVLCollection.prototype.push = function(element) {
    this.blocks[this._array.length] = this._fn(element);
    console.log(this.blocks);
    return this._array.push(element);
  };

  DVLCollection.prototype.remove = function(element) {
    var compare, i;

    i = null;
    compare = this._compare;
    this._array.forEach(function(_element, k) {
      if (compare(_element, element)) {
        return i = k;
      }
    });
    if (i == null) {
      return false;
    }
    this._array.splice(i, 1);
    this.blocks.discard();
    return true;
  };

  return DVLCollection;

})();

module.exports = DVLCollection;