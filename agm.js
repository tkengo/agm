var data;
var p;
var sigma;
var m;
var gamma;
var N;
var K;
var D;

var LAMBDA = 0.23;
var TAU = 0.55;
var maxIt = 1;
var it = 0;

window.onload = function() {
  initialize();
  _draw(true);

  document.getElementById('next').addEventListener('click', function() {
    runIteration();
  });
  document.getElementById('reset').addEventListener('click', function() {
    initialize();
    draw(true);
  });
};

function createData(dataNum, componentCount) {
  var data = [];
  var r = [], cx = [], cy = [];

  for (var i = 0; i < componentCount; i++) {
    var r  = 0.1 * Math.random();
    var cx = Math.random();
    var cy = Math.random();
    var cz = Math.random();
    for (var n = 0; n < dataNum; n++) {
      data.push([
        cx + r * Mx.Utils.randn(),
        cy + r * Mx.Utils.randn()
      ]);
    }
  }

  return data;
}

function initialize() {
  var dataNum = document.getElementById('data_num').value;
  var componentNum = document.getElementById('component_num').value;
  data = Matrix.create(createData(dataNum, componentNum));

  N = data.rows;
  K = data.rows;
  D = data.cols;

  p     = Vector.create(data.rows, 1.0 / data.rows).t();
  sigma = Vector.create(data.rows, 0.02).t();
  m     = data.clone();

  it = 0;
  document.getElementById('K').innerText = '?';
  document.getElementById('it').innerText = it;
}

function _draw() {
  var mathbox = mathBox(document.getElementById('box'), {
    // Whether to allow mouse control of the camera.
    cameraControls: true,
    // Override the class to use for mouse controls.
    controlClass: ThreeBox.OrbitControls,
    // Whether to show the mouse cursor.
    // When set to false, the cursor auto-hides after a short delay.
    cursor: true,
  }).start();

  mathbox.viewport({
    type: 'cartesian',
    range: [ [0, 1.1 ], [ 0, 1.1 ], [ 0, 1.1 ] ],
    scale: [ 1, 1, 1 ],
  }).axis({
    id: 'x-axis',
    axis: 0,
    color: 0xa0a0a0,
    ticks: 5,
    lineWidth: 2,
    size: .05,
    labels: true,
  })
  .axis({
    id: 'y-axis',
    axis: 1,
    color: 0xa0a0a0,
    ticks: 5,
    lineWidth: 2,
    size: .05,
    labels: true,
    zero: false,
  })
  .axis({
    id: 'z-axis',
    axis: 2,
    color: 0xa0a0a0,
    ticks: 5,
    lineWidth: 2,
    size: .05,
    zero: false,
    labels: true,
  }).grid({
    id: 'my-grid',
    axis: [0, 2],
    color: 0xc0c0c0,
    lineWidth: 1,
  }).camera({
    orbit: 5.5,        // Distance from the center
    lookAt: [0, 0, 0], // Point of focus in space
  }).curve({
    id: 'controlPoints',
    n: data.rows,
    // data: controlData,
    data: data.toArray(),
    pointSize: 3,
    points: true,
    line: false,
    color: 0xff0000,
  }).curve({
    n: m.rows,
    data: m.toArray(),
    pointSize: 5,
    points: true,
    line: false,
    color: 0x0000ff,
  });

    document.getElementById('K').innerText = K;
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
      p2[r] = board.create('point', [ m[r][0], m[r][1] - sigma[r] ], { visible: false });
    }
    for (var r = 0; r < sigma.rows; r++) {
      board.create('circle', [ p1[r], p2[r] ]);
    }

    document.getElementById('K').innerText = K;
    document.getElementById('it').innerText = it;
  }
}

function runIteration() {
  for (var loop = 0; loop < maxIt; loop++) {
    it++;
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
      var expc = dist_k.col(k).pow(2).div(sigma_j.clone().pow(2).mul(2));
      expc.mul(-1);
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

    // var ik = 0;
    // while (ik < K) {
    //   var id = p.clone().sortWithIndex('desc')[1];
    //   var k = id[ik];
    //   var sum = 0;
    //   for (var i = 0; i < ik + 1; i++) {
    //     sum += gamma_k[k][id[i]];
    //   }
    //   if (gamma_k[k][k] / sum < TAU) {
    //     p.remove(k);
    //     sigma.remove(k);
    //     m.removeRow(k);
    //     gamma_k.removeRow(k);
    //     gamma_k.removeCol(k);
    //     K--;
    //   } else {
    //     ik++;
    //   }
    // }
    var keeps = [];
    var id = p.sortWithIndex('desc')[1];
    for (var i = 0; i < id.length; i++) {
      var k = id[i];
      var sum = 0;
      for (var j = 0; j < keeps.length; j++) {
        sum += gamma_k[k][keeps[j]];
      }

      var rho = gamma_k[k][k] / (gamma_k[k][k] + sum);
      if (rho >= TAU) {
        keeps.push(k);
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
