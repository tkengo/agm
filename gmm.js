var data = Matrix.create(_data);
var p;
var cov;
var m;
var gamma;
var N;
var K;
var D;
var it = 0;

window.onload = function() {
  initialize();
  // draw();

  document.getElementById('next').addEventListener('click', function() {
    initialize();
    runIteration();
  });
  document.getElementById('reset').addEventListener('click', function() {
    initialize();
    // draw(true);
  });
};

function createData(dataNum, componentCount) {
  var data = [];
  var r = [], cx = [], cy = [];

  var vec = Vector.empty(Vector.COL);
  for (var i = 0; i < componentCount; i++) {
    var r  = 0.1 * Math.random();
    var cx = 0.3;// Math.random();
    var cy = 0.7;// Math.random();
    var cz = 0.9;// Math.random();
    // vec = vec.vcat(Vector.randn(dataNum, Vector.COL).mul(r).add(cx));
    for (var n = 0; n < dataNum; n++) {
      // data.push([
      //   cx + r * Mx.Utils.randn(),
      //   cy + r * Mx.Utils.randn()
      // ]);
    }
  }

  var cx = 0.3;// Math.random();
  var cy = 0.7;// Math.random();
  var cz = 0.9;// Math.random();
  vec = vec.vcat(Vector.randn(dataNum, Vector.COL).mul(0.01 * Math.random()).add(0.3));
  vec = vec.vcat(Vector.randn(dataNum, Vector.COL).mul(0.01 * Math.random()).add(0.7));
  vec = vec.vcat(Vector.randn(dataNum, Vector.COL).mul(0.01 * Math.random()).add(0.9));
  return vec;
}

function initialize() {
  var dataNum = document.getElementById('data_num').value;
  var componentNum = document.getElementById('component_num').value;
  //data = Matrix.create(createData(dataNum, componentNum));

  document.getElementById('like').innerText = '';
  document.getElementById('m').innerText = '';
  document.getElementById('c').innerText = '';
  document.getElementById('p').innerText = '';
  document.getElementById('g').innerText = '';

  N = data.rows;
  K = componentNum;
  D = data.cols;

  data  = scale(data);
  gamma = Matrix.zeros(N, K);
  p     = Vector.create([ 0.33, 0.33, 0.34 ], Vector.COL);
  m     = Matrix.rand(K, D);
  cov   = new Array(K);
  for (var k = 0; k < K; k++) {
    cov[k] = Matrix.eye(D);
  }

  it = 0;
  document.getElementById('K').innerText = '?';
  document.getElementById('it').innerText = it;
}

function draw(ignoreDrawingComponent) {
  var board = JXG.JSXGraph.initBoard('box', {
    axis: true,
    boundingbox: [ 0, 1.1, 1.1, 0 ],
  });

  for (var r = 0; r < data.rows; r++) {
    board.create('point', data[r], { size: 0.5, withLabel: false });
  }

  if (!ignoreDrawingComponent) {
    var p1 = [];
    var p2 = [];
    for (var r = 0; r < m.rows; r++) {
      p1[r] = board.create('point', m[r], { size: 2, withLabel: false, fillColor: 'blue', strokeColor: 'blue' });
      p2[r] = board.create('point', [ m[r][0], m[r][1] - 0.1 ], { visible: true });
    }
    for (var r = 0; r < sigma.rows; r++) {
      board.create('circle', [ p1[r], p2[r] ]);
    }

    document.getElementById('K').innerText = K;
    document.getElementById('it').innerText = it;
  }
}

function scale(data) {
  var mu = data.meanCols();
  var sigma = data.stdCols();

  data.mapCols(function(col, c) {
    // return M(function() { (col - mu[c].vec) / sigma[c].vec });
    return col.sub(mu[c]).div(sigma[c]);
  });
  return data;
}

function gaussian(x, mean, cov) {
  var coefficient = 1.0 / (Math.pow(2 * Math.PI, D / 2.0) * Math.sqrt(cov.det()));
  var diff = M(x - mean);
  // var expp = M(function() { diff ^ cov.inv() ^ diff.clone().t() });
  var expp = diff * cov.inv()[0][0] * diff;
  return coefficient * Math.exp(-0.5 * expp);
}

function likelihood(data, mean, cov, pi) {
  var sum = 0;
  for (var n = 0; n < data.rows; n++) {
    var logp = 0;
    for (var k = 0; k < K; k++) {
      logp += pi[k] * gaussian(data.row(n), mean.row(k), cov[k]);
    }
    sum += Math.log(logp);
  }
  return sum;
}

var MAX_ITERATION = 100;
function runIteration() {
  var X = data;

  var like = likelihood(X, m, cov, p);
  var el = document.getElementById('like');

  var turn = 0;
  while (turn < MAX_ITERATION) {
    console.log(like);
    el.innerHTML += "<br/>" + (++turn) + "th iteration: " + like;

    for (var n = 0; n < N; n++) {
      var denominator = 0;
      for (var k = 0; k < K; k++) {
        denominator += p[k] * gaussian(X.row(n), m.row(k), cov[k]);
      }
      for (var k = 0; k < K; k++) {
        gamma[n][k] = p[k] * gaussian(X.row(n), m.row(k), cov[k]) / denominator;
      }
    }

    for (var k = 0; k < K; k++) {
      var Nk = gamma.sumCols(k);

      var newM = Vector.zeros(D);
      for (var n = 0; n < N; n++) {
        newM.add(X.row(n).mul(gamma[n][k]));
      }
      m.setRow(k, newM.div(Nk));

      cov[k] = Matrix.zeros(D);
      for (var n = 0; n < N; n++) {
        var tmp = M(X.row(n) - m.row(k)).t();
        var add = M(tmp ^ tmp.clone().t()) * gamma[n][k];
        cov[k].add(add);
      }
      cov[k].div(Nk);

      p[k] = Nk / N;
    }

    var newLike = likelihood(X, m, cov, p);
    var diff = Math.abs(newLike - like);
    if (diff < 0.01) {
      break;
    }
    like = newLike;
  }

  document.getElementById('m').innerText = m.toString();
  document.getElementById('c').innerText = cov[0][0][0] + "\n" + cov[1][0][0] + "\n" + cov[2][0][0];
  document.getElementById('p').innerText = p.toString();
  document.getElementById('g').innerText = gamma.toString();
}
