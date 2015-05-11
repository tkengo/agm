/**
 * Constructor for Matrix object. Generate Matrix object from an array of JavaScript.
 * `elements` argument must be 2 dims array.
 */
var Matrix = function(elements) {
  this.set(elements);
};

Matrix.create = function(rows, cols, initVal) {
  var elements = [];

  if (typeof rows == 'number') {
    if (rows > 0 && cols > 0) {
      initVal = initVal || 0;
      for (var r = 0; r < rows; ++r) {
        var row = [];
        for (var c = 0; c < cols; ++c) {
          row[c] = initVal;
        }
        elements[r] = row;
      }
    }
  } else {
    rows = rows || [];
    if (typeof rows[0] == 'number') {
      elements = [ rows ];
    } else {
      elements = rows;
    }
  }

  return new Matrix(elements);
};

Matrix.zeros = function(rows, cols) {
  return Matrix.create(rows, cols || rows, 0);
};

Matrix.prototype = {
  toString: function() {
    var s = '';
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        s += ' ' + this[r][c];
      }
      s += "\n";
    }
    return s;
  },

  disp: function() {
    console.log(this.toString());
  },

  clone: function() {
    var elements = [];
    for (var r = 0, len = this.rows; r < len; ++r) {
      elements[r] = this[r].concat();
    }
    return new Matrix(elements);
  },

  map: function(f) {
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      var row = this[r];
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        row[c] = f(row[c]);
      }
    }
    return this;
  },

  set: function(elements) {
    this.rows = elements.length;
    this.cols = this.rows == 0 ? 0 : elements[0].length;

    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      var row = [];
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        row[c] = elements[r][c];
      }
      this[r] = row;
    }
  },

  setCol: function(index, col) {
    if (typeof col == 'number') {
      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        this[r][index] = col;
      }
    } else {
      if (this.rows != col.rows || this.cols <= index) {
        return undefined;
      }

      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        this[r][index] = col[r];
      }
    }
    return this;
  },

  setRow: function(index, row) {
    if (typeof row == 'number') {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        this[index][c] = row;
      }
    } else {
      if (this.cols != row.cols || this.rows <= index) {
        return undefined;
      }

      for (var c = 0, clen = this.cols; c < clen; ++c) {
        this[index][c] = row[c];
      }
    }
    return this;
  },

  at: function(row, col) {
    if (typeof col == 'undefined') {
      col = row % this.cols;
      row = row / this.cols;
    }
    return this[row][col];
  },

  row: function(row) {
    return Vector.create(this[row].concat(), Vector.ROW);
  },

  col: function(col) {
    var elements = [];
    for (var r = 0, len = this.rows; r < len; ++r) {
      elements[r] = this[r][col];
    }
    return Vector.create(elements, Vector.COL);
  },

  flat: function() {
    var elements = [], index = 0;
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        elements[index++] = this[r][c];
      }
    }
    return elements;
  },

  t: function() {
    var elements = [];
    for (var c = 0, clen = this.cols; c < clen; ++c) {
      var row = [];
      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        row[r] = this[r][c];
      }
      elements[c] = row;
    }

    this.set(elements);
    return this;
  },

  add: function(v) {
    if (typeof v == 'number') {
      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        for (var c = 0, clen = this.cols; c < clen; ++c) {
          this[r][c] += v;
        }
      }
    } else {
      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        for (var c = 0, clen = this.cols; c < clen; ++c) {
          this[r][c] += v[r][c];
        }
      }
    }
    return this;
  },

  mul: function(v) {
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        this[r][c] *= v;
      }
    }
    return this;
  },

  div: function(v) {
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        this[r][c] /= v;
      }
    }
    return this;
  },

  pow: function(p) {
    if (p == 1) {
      return this;
    }

    var _pow = Mx.Utils.getPow(p);
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        this[r][c] = _pow(this[r][c]);
      }
    }

    return this;
  },

  minWithIndex: function() {
    var elements = this.flat();
    var min = Math.min.apply(null, elements);
    var index = elements.indexOf(min);
    return [ min, index ];
  },

  maxRows: function() {
    var maxes = [];
    for (var r = 0, len = this.rows; r < len; ++r) {
      maxes[r] = Math.max.apply(null, this[r]);
    }
    return Vector.create(maxes, Vector.COL);
  },

  sum: function() {
    var sum = 0;
    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        sum += this[r][c];
      }
    }
    return sum;
  },

  sumCols: function() {
    var sum = [];

    for (var c = 0, clen = this.cols; c < clen; ++c) {
      sum[c] = 0;
      for (var r = 0, rlen = this.rows; r < rlen; ++r) {
        sum[c] += this[r][c];
      }
    }

    return Vector.create(sum, Vector.ROW);
  },

  sumRows: function() {
    var sum = [];

    for (var r = 0, rlen = this.rows; r < rlen; ++r) {
      sum[r] = 0;
      for (var c = 0, clen = this.cols; c < clen; ++c) {
        sum[r] += this[r][c];
      }
    }

    return Vector.create(sum, Vector.COL);
  }
};

asMath.call(Matrix.prototype);
