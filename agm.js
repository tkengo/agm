var data = Matrix.create(_data);
var data = Matrix.create(createData(800, 5));
var p;
var sigma;
var m;
var gamma;

var LAMBDA = 0.55;
var TAU = 0.22;
var N = data.rows;
var K = data.rows;
var D = data.cols;
var maxIt = 1;

window.onload = function() {
  draw();
  initialize();
};

function createData(dataNum, componentCount) {
  var count = dataNum / componentCount;
  var data = [];
  var r = [], cx = [], cy = [];

  for (var i = 0; i < componentCount; i++) {
    var r  = 0.1 * Math.random();
    var cx = Math.random();
    var cy = Math.random();
    for (var n = 0; n < count; n++) {
      data.push([ cx + r * Mx.Utils.randn(), cy + r * Mx.Utils.randn() ]);
    }
  }

  return data;
}

function initialize() {
  p     = Vector.create(data.rows, 1.0 / data.rows).t();
  sigma = Vector.create(data.rows, 0.02).t();
  m     = data.clone();

  document.getElementById('next').addEventListener('click', function() {
    runIteration();
  });
}

function draw() {
  var board = JXG.JSXGraph.initBoard('box', {
    axis: true,
    boundingbox: [ 0, 1.1, 1.1, 0 ],
  });

  for (var r = 0; r < data.rows; r++) {
    board.create('point', data[r], { size: 0.5, withLabel: false });
  }

  if (m && sigma) {
    var p1 = [];
    var p2 = [];
    for (var r = 0; r < m.rows; r++) {
      p1[r] = board.create('point', m[r], { size: 2, withLabel: false, fillColor: 'blue', strokeColor: 'blue' });
      p2[r] = board.create('point', [ m[r][0], m[r][1] - sigma[r] ], { visible: false });
    }
    for (var r = 0; r < sigma.rows; r++) {
      board.create('circle', [ p1[r], p2[r] ]);
    }

    document.getElementById('N').innerText = '現在のK = ' + K;
  }
}

function runIteration() {
  for (var loop = 0; loop < maxIt; loop++) {
    gamma = Matrix.zeros(N, K);
    var dist = distance(data, m);

    for (var k = 0; k < K; k++) {
      var c    = p[k] * Math.pow(sigma[k], -D);
      var expc = -1.0 / (2 * sigma[k] * sigma[k]);
      var col  = dist.col(k).pow(2).mul(expc).exp().mul(c);
      gamma.setCol(k, col);
    }

    for (var n = 0; n < N; n++) {
      var aa = gamma.row(n);
      var sg = aa.sum();
      if (sg) {
        gamma.setRow(n, aa.div(sg));
      } else {
        var index = dist.row(n).minWithIndex()[1];
        gamma.setRow(n, 0);
        gamma[n][index] = 1;
      }
    }

    draw();

    var Nk = gamma.sumCols();

    p = Nk.clone().div(N);
    for (var k = 0; k < K; k++) {
      var row = Vector.zeros(D);
      for (var n = 0; n < N; n++) {
        row.add(data.row(n).mul(gamma[n][k]));
      }
      m.setRow(k, row.mul(1.0 / Nk[k]));
    }

    var gamma_max = gamma.maxRows();
    for (var k = 0; k < K; k++) {
      var Nin_k      = 0, Nout_k      = 0;
      var sigma_in_k = 0, sigma_out_k = 0;

      for (var n = 0; n < N; n++) {
        if (gamma[n][k] == gamma_max[n]) {
          Nin_k      += gamma[n][k];
          sigma_in_k += gamma[n][k] * dist[n][k] * dist[n][k];
        } else {
          Nout_k      += gamma[n][k];
          sigma_out_k += gamma[n][k] * dist[n][k] * dist[n][k];
        }
      }

      if (Nin_k) {
        sigma_in_k = Math.sqrt(sigma_in_k / (D * Nin_k));
      }
      if (Nout_k) {
        sigma_out_k = Math.sqrt(sigma_out_k / (D * Nout_k));
      }

      var w = (1 - LAMBDA) * (Nin_k / Nk[k]);
      sigma[k] = Math.sqrt(w * sigma_in_k * sigma_in_k + (1 - w) * sigma_out_k * sigma_out_k);
    }

    var dist_k = distance(m, m);
    var gamma_k = Matrix.zeros(K);
    for (var k = 0; k < K; k++) {
      var sigma_j = sigma.clone().pow(2).add(sigma[k] * sigma[k]).sqrt();
      var c = sigma_j.clone().pow(-D).mul(p[k]);
      var expc = dist_k.col(k).pow(2).div(sigma_j.pow(2).mul(2));
      gamma_k.setCol(k, c.mul(expc.exp()));
    }

    for (var n = 0; n < K; n++) {
      var aa = gamma_k.row(n);
      var sg = aa.sum();
      if (sg) {
        gamma_k.setRow(n, aa.div(sg));
      } else {
        var index = dist_k.row(n).minWithIndex()[1];
        gamma_k.setRow(n, 0);
        gamma_k[n][index] = 1;
      }
    }

    var keeps = [];
    // var ik = 1;
    // while (ik <= K) {
    //   var id = p.sortWithIndex('desc')[1];
    //   var k = id[ik];
    //   var sum = 0;
    //   for (var i = 0; i < ik; i++) {
    //     sum += gamma_k[k][id[i]];
    //   }
    //   if (gamma_k[k][k] / sum < TAU) {
    //     K--;
    //   } else {
    //     keeps.push(k);
    //     ik++;
    //   }
    // }
    var id = p.sortWithIndex('desc')[1];
    for (var k = 0; k < id.length; k++) {
      var i = id[k];
      var sum = 0;
      for (var j = 0; j < keeps.length; j++) {
        sum += gamma_k[i][keeps[j]];
      }

      var rho = gamma_k[i][i] / (gamma_k[i][i] + sum);
      if (rho >= TAU) {
        keeps.push(i);
      }
    }
    var new_p = [], new_m = [], new_sigma = [];
    for (var i = 0; i < keeps.length; i++) {
      new_p[i]     = p[keeps[i]];
      new_m[i]     = m[keeps[i]];
      new_sigma[i] = sigma[keeps[i]];
    }
    p     = Vector.create(new_p).t();
    m     = Matrix.create(new_m);
    sigma = Vector.create(new_sigma).t();
    K     = keeps.length;
  }
}

function distance(m1, m2) {
  var sum1 = m1.clone().pow(2).sumRows();
  var sum2 = m2.clone().pow(2).sumRows();

  var distance = [];
  for (var i = 0; i < sum1.rows; i++) {
    distance[i] = [];
    for (var j = 0; j < sum2.rows; j++) {
      distance[i][j] = Math.sqrt(sum1[i] + sum2[j] - 2 * m1.row(i).dot(m2.row(j)));
    }
  }

  return Matrix.create(distance);
}
