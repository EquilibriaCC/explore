const channels = {
  icarus: {
    name: 'Icarus (Unstable)',
    url: 'https://delfi.equilibria.network/api'
  },
  daedalus: {
    name: 'Daedalus (Stable)',
    url: 'https://delfi.equilibria.network/api',
  }
}

const config = {
  txQuerySize: 500,
  graphMaxSize: 100000,
  txQueryInterval: 20000,
  fitScreenInterval: 4000
}

const graph = {
  nodes: undefined,
  edges: undefined
}

let allTxs = [];
let txQueue = [];
let graphHistory = [];

let channel;
let transactionsTable;
let network;
let lastFitScreen = 0;

$(document).ready(function() {
  $("body").tooltip({ selector: '[data-toggle=tooltip]' });

  graph.nodes = new vis.DataSet([]);
  graph.edges = new vis.DataSet([]);

  const graphView = document.getElementById("graph-view");
  network = new vis.Network(graphView, graph, getGraphOptions());
  addNode();

  initChannelSelector();
  initTransactionsTable();
  
  $.ajax({
    url: `${channel.url}/transactions/asc/all`,
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (txs) {
      updateTransactionsData(txs);
    },
    error: function() {
      console.log('error fetching txs!');
      transactionsTable.clear();
      transactionsTable.draw(false);
    }
  });
  switchChannel(channels.icarus);
  startRefreshDataLoop(config.txQueryInterval);
  

  $.ajax({
    url: `${channel.url}/api/v1/transactions/asc/nondatatxs`,
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (txs) {
      updateTransactionsData(txs);
    },
    error: function() {
      console.log('error fetching txs!');
      transactionsTable.clear();
      transactionsTable.draw(false);
    }
  });
	startUpdateGraphLoop();

  $('#searchValue').keydown(function (e) {
    // setSearchValueErrorState(false);

    // check if 'Enter' key was pressed
    if (e.which === 13) {
      const term = $('#searchValue').val();

      if (isHash(term)) {
        const chl = encodeURIComponent(channel.url);
        return document.location.href=`./transaction.html?channel=${chl}&hash=${term}`;
      }
    }
  });
  $('#searchContract').keydown(function (e) {
    // setSearchValueErrorState(false);

    // check if 'Enter' key was pressed
    if (e.which === 13) {
      const term = $('#searchContract').val();

      if (isHash(term)) {
        const chl = encodeURIComponent(channel.url);
        return document.location.href=`./contract.html?channel=${chl}&hash=${term}`;
      }
    }
  });
});

function fetchChannelStats(clear = false) {
  if (clear) {
    clearChannelStats();
  }

  
      $('#channelName').text("Delfi");
      $('#channelDescription').text("Delfi Channel");
      $('#channelVersion').text("1");
      $('#channelContact').text("Contact@equilibria.network");
      $('#channelPubKey').text("");
      $('#channelTxCount').text("");
      $('#channelUsersCount').text("");
    
}

function clearChannelStats() {
  $('#channelName').text('');
  $('#channelDescription').text('');
  $('#channelVersion').text('');
  $('#channelContact').text('');
  $('#channelPubKey').text('');
  $('#channelTxCount').text('');
  $('#channelUsersCount').text('');
}

function initChannelSelector() {
  $('#select-daedalus').click(function() {
    if (channel.url !== channels.daedalus.url)
      switchChannel(channels.daedalus);
  });
  $('#select-icarus').click(function() {
    if (channel.url !== channels.icarus.url)
      switchChannel(channels.icarus);
  });
}

function switchChannel(newChan) {
  channel = newChan;
  $('#chan-select-title').text(channel.name);
  fetchChannelStats(true);
  fetchTransactions(true);
}

function fetchTransactions(clear = false) {
  if (clear) {
    transactionsTable.clear();
    transactionsTable.draw(false);
  }

  $.ajax({
    url: `${channel.url}/transactions/desc/nondatatxs`,
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (txs) {
      updateTransactionsData(txs);
    },
    error: function() {
      console.log('error fetching txs!');
      transactionsTable.clear();
      transactionsTable.draw(false);
    }
  });
}

function startRefreshDataLoop(interval) {
  function refreshData() {
    setTimeout(function () {
      fetchTransactions();
      refreshData();
    }, interval)
  }
  refreshData();
}

function startUpdateGraphLoop() {
  function update() {
    const delay = 50 + Math.random() * 500;

    setTimeout(function () {
      updateGraph(txQueue);

      if (graphHistory.length > config.graphMaxSize) {
        resetGraph();
      }

      update();
    }, delay)
  }
  update();
}

function initTransactionsTable() {
  transactionsTable = $('#transactions').DataTable({
    columnDefs: [{
      targets: [0, 1, 2, 3],
      searchable: false
    }, {
      targets: 0,
      width: '15%',
      render: function (data, type, row, meta) {
        if (type === 'display') {
          data = moment(data/1000000).format("D/M/YYYY HH:mm");
        }
        return data;
      }
    }, {
      targets: 1,
      width: '7%',
      render: function (data, type, row, meta) {
        if (type === 'display') {
          let badge;

          switch (data) {
            case '0':
              badge = 'badge bg-azure';
              break;
            case '1':
              badge = 'badge bg-indigo';
              break;
            case '2':
              badge = 'badge bg-purple';
              break;
           case '3':
		badge = 'badge bg-red'  
	}

          data = `<span class="${badge}">${data}</span>`;
        }
        return data;
      }
    }, {
      targets: 2,
      render: function (data, type, row, meta) {
        if (type === 'display') {
          const chl = encodeURIComponent(channel.url);
          data = `
            <a href="./transaction.html?channel=${chl}&hash=${data}">
              <span class="transaction-hash" data-toggle="tooltip" data-placement="top" title="${data}">
                ${getColorizedHex(data)}
              </span>
            </a>
          `;
        }
        return data;
      }
    }, {
      targets: 3,
      width: '100px',
      render: function (data, type, row, meta) {
        if (type === 'display') {
          data = `<span>${getTxDataText(data, row[2])}</span>`;
        }
        return data;
      }
    }],
    searching: false,
    ordering: true,
    order: [[0, 'desc']],
    info: false,
    paging: false,
    lengthMenu: -1,
    language: {
      emptyTable: "No transactions"
    },
    autoWidth: false
  }).columns.adjust().responsive.recalc();
}

function updateTransactionsData(txs) {
  let redrawTable = false;

  txs.forEach(tx => {
    if (!allTxs.some(t => t.hash === tx.hash)) {
      allTxs.push(tx);
      transactionsTable.rows.add([[tx.time, tx.type, tx.hash, tx]]);
      redrawTable = true;

      if (!txQueue.some(t => t.hash === tx.hash)) {
        txQueue.push(tx);
      }
    }
  });

  if (redrawTable) {
    transactionsTable.draw(false);
  }
}

function updateGraph(txs) {
  if (document.visibilityState !== 'visible') {
    return;
  }

  const items = JSON.parse(JSON.stringify(txs));
  const now = Date.now();

  if (now > lastFitScreen + config.fitScreenInterval) {
    network.fit({ animation: { duration: 800 } });
    lastFitScreen = now;
  }

  while (items.length > 0) {
    for(let i = 0; i < items.length; i++) {
      const tx = items[i];
      const existingNode = graph.nodes.get(tx.hash);

      if (existingNode) {
        items.splice(i, 1);
        continue;
      }

     // if (!graphHistory.some(n => n.id === tx.subg)) {
       // graphHistory.push({ id: tx.subg, lead: true });

       // graph.nodes.add({ id: tx.subg, color: '#14afde', shape: 'hexagon', size: 25 });
       // graph.edges.add({ from: 'root', to: tx.subg });
     // }

      const parent = graphHistory.find(n => n.id === tx.prnt);
      const parentNodeId = parent ? parent.id : tx.subg;

      addNode(tx,parentNodeId);
      return;
    }
  }
}

function addNode(tx, parentId) {
  if (!tx) {
    // if no transaction is provided, we treat it as the root node of the graph
    graph.nodes.add({ id: 'root', color: '#43b380', shape: 'hexagon', size: 40 });
    //graphHistory.push({ id: 'root', lead: true });

    return;
  }
  
 var shape = ""
var size_t = 50
 if (tx.type == "1") {
	shape = "hexagon"
	} else if (tx.type =="2") {
	shape = "dot"
	} else if (tx.type =="3") {
	shape = "sqaure"
	size_t  = 80
		}

  graph.nodes.add({ id: tx.hash, shape: shape, group: tx.subg, size: size_t });
  graphHistory.push({ id: tx.hash ,lead: tx.lead});

  const parentNode = graph.nodes.get(parentId);

  if (parentNode) {
    graph.edges.add({ from: tx.hash, to: tx.prev });
  }

  const index = txQueue.findIndex(t => t.hash === tx.hash);
  txQueue.splice(index, 1);
}

function resetGraph() {
  const allEdges = graph.edges.get();
  const allNodes = graph.nodes.get();

  for (let i = allEdges.length - 1; i >= 0; i--) {
    graph.edges.remove(allEdges[i]);
  }

  for (let i = allNodes.length - 1; i >= 0; i--) {
    graph.nodes.remove(allNodes[i].id);
  }

  allTxs = [];
  graphHistory = [];
  txQueue = [];

  addNode();
}

function getTxDataText(data, hash) {
  let json;
  let text = 'TEXT';
  try {
    json = JSON.parse(data.data);
  } catch (err) {
  }

  if (json && json instanceof Object) {
    text = `TX`;
  }
  try {
    if (json.Asset) {
      text = `CONTRACT`
      hash = data.subg
    }
  } catch {
    text = `TX`;
  }

  const chl = encodeURIComponent(channel.url);
  if (text === `CONTRACT`) {
    return `<a href="./contract.html?channel=${chl}&hash=${hash}"><span class="transaction-hash">${text}</span></a>`;
  } else {
    return `<a href="./transaction.html?channel=${chl}&hash=${hash}"><span class="transaction-hash">${text}</span></a>`;
  }
}

function getGraphOptions() {
  return {
    interaction:{
      dragNodes:true,
      dragView: true,
      hideEdgesOnDrag: false,
      hideEdgesOnZoom: false,
      hideNodesOnDrag: false,
      hover: true,
      hoverConnectedEdges: true,
      keyboard: {
        enabled: true,
        speed: {x: 10, y: 10, zoom: 0.02},
        bindToWindow: true
      },
      multiselect: true,
      navigationButtons: false,
      selectable: true,
      selectConnectedEdges: true,
      tooltipDelay: 300,
      zoomSpeed: 1,
      zoomView: true
    },
    layout: {
      randomSeed: undefined,
      improvedLayout:true,
      clusterThreshold: 150,
      hierarchical: {
        enabled:false,
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: false,
        direction: 'LR',        // UD, DU, LR, RL
        sortMethod: 'directed',  // hubsize, directed
        shakeTowards: 'roots'  // roots, leaves
      }
    },
    physics:{
      enabled: true,
      barnesHut: {
        theta: 0.5,
        gravitationalConstant: -8000,
        centralGravity: 0.1,
        springLength: 95,
        springConstant: 0.44,
        damping: 0.19,
        avoidOverlap: 0
      },
      forceAtlas2Based: {
        theta: 0.5,
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springConstant: 0.08,
        springLength: 100,
        damping: 0.4,
        avoidOverlap: 0
      },
      repulsion: {
        centralGravity: 0.2,
        springLength: 200,
        springConstant: 0.05,
        nodeDistance: 100,
        damping: 0.09
      },
      hierarchicalRepulsion: {
        centralGravity: 0.0,
        springLength: 100,
        springConstant: 0.01,
        nodeDistance: 120,
        damping: 0.09,
        avoidOverlap: 0
      },
      maxVelocity: 50,
      minVelocity: 0.1,
      solver: 'barnesHut',
      stabilization: {
        enabled: true,
        iterations: 1000,
        updateInterval: 100,
        onlyDynamicEdges: true,
        fit: false
      },
      timestep: 0.5,
      adaptiveTimestep: true,
      wind: { x: -0.05, y: 0.02 }
    }
  }
}
