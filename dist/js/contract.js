let priceData = []
let timeData = []
let graphTitle = []
let contractTable



async function graph() {
	while (priceData.length === 0 && timeData.length === 0) {
		await new Promise(r => setTimeout(r, 100));
	}
	var ctx = document.getElementById('myChart').getContext('2d');
	Chart.defaults.global.defaultFontColor = '#fff';

	var myChart = new Chart(ctx, {

		type: 'line',
		data: {
			labels: timeData,
			datasets: [{
				label: graphTitle + " Price",
				data: priceData,
				borderColor: [
					'#14afde',
				],
				borderWidth: 1				
			}]
		},
		options: {
			title: {
				display: true,
				text: graphTitle + " Price Data",
				fontSize: 22,				
			},
			fill: true,
			cubicInterpolationMode: "monotone",

		}
	});
}
// ADD table pub_key, source, price

function table() {
	contractTable = $('#transactionsContract').DataTable({
		columnDefs: [{
			targets: [0, 1, 2, 3, 4],
			searchable: false
		}, {
			targets: 0,
			width: '20%',
			render: function (data, type, row, meta) {
				if (type === 'display') {
					data = moment(data/1000000).format("D/M/YYYY HH:mm");
					data = `<span>${data}</span>`
				}
				return data;
			}
		}, {
			targets: 1,
			width: '50%',
			render: function (data, type, row, meta) {
				if (type === 'display') {
					data = `<span>${data}</span>`
				}
				return data
			}
		}, {
			targets: 2,
			width: '15%',
			render: function (data, type, row, meta) {
				if (type === 'display') {
					data = data = `<span>${data}</span>`
				}
				return data
			}
		}, {
			targets: 3,
			width: '15%',
			render: function (data, type, row, meta) {
				if (type === 'display') {
					data = `<span>${data}</span>`
				}
				return data;
			}
		}, {
            targets: 4,
            width: '15%',
            render: function (data, type, row, meta) {
                if (type === 'display') {
                    data = `<span>${data}</span>`
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
$(document).ready(function () {
	let channel = getQueryStringParam("channel");
	const hash = getQueryStringParam("hash");
	if (!channel || !isHash(hash)) {
		return (document.location.href = "../../index.html");
	}

	channel = decodeURIComponent(channel);
	$.ajax({
		url: `${channel}/transactions/contract/${hash}`,
		dataType: "json",
		type: "GET",
		cache: "false",
		success: function (tx) {
			// if (tx[0].type !== 3) {
			// 	return (document.location.href = "./index.html")
			graphTitle = JSON.parse(tx[0].data).Asset + "/" + JSON.parse(tx[0].data).Denom
			// }
			table(tx)
			for (let i = 0; i < tx.length; i++) {
				tx[i].data = JSON.parse(tx[i].data)
				
				console.log(tx[i])	
				
				if (i !== 0) {
				//	contractTable.rows.add([[tx[i].time, tx[i].data.pubkey, tx[i].data.data, tx[i].data.source, tx[i].data.task]]);
				//	contractTable.draw(true);
				}

				if (tx[i].type === "2") {
					priceData.push(tx[i].data.TrustedAnswer).toFixed(8)
					let d = new Date(tx[i].time/1000000)
					let tm = moment(tx[i].time/1000000).format("D/M/YYYY HH:mm");
					timeData.push(tm)
				}
			}
				
			$("#Ktransaction").text(tx[0].hash);
			$("#type").append(getTxTypeBadge(tx[0].type));
			$("#previous").append(`
        <a href="./contract.html?channel=${channel}&hash=${tx[0].prev}">
          <span class="transaction-hash" data-toggle="tooltip" title="${tx[0].prev}">
            ${getColorizedHex(tx[0].prev)}
          </span>
        </a>
      `);
      $("#size").text(getTxSize(tx));
      $("#subg").append(`
        <a href="#">
          <span class="transaction-hash" data-toggle="tooltip" title="${tx[0].subg}">
            ${getColorizedHex(tx[0].subg)}
          </span>
        </a>
      `);
			$("#milestone").text(tx[0].mile);
			$("#timestamp").text(
				moment(tx[0].time / 1000000).format("D/M/YYYY HH:mm")
      );
      $("#lead").text(tx[0].lead);
			$("#epoch").text(tx[0].epoc);
      $("#data").text(JSON.stringify((tx), null, 4));

      $("#theme-toggle").click(() => {
        refreshCodeHighlightStyle();
      });

      refreshCodeHighlightStyle();

      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
		},
		error: function () {
			// return (document.location.href = "./index.html");
		},
	});

	$("body").tooltip({
		selector: "[data-toggle=tooltip]",
		boundary: "window",
	});
});

function getTxTypeBadge(type) {
	let badge;

	switch (type) {
		case "0":
			badge = "badge bg-azure";
			break;
		case "1":
			badge = "badge bg-indigo";
			break;
		case "2":
			badge = "badge bg-purple";
			break;
	}

	return `<span class="${badge}">${type}</span>`;
}

function getTxSize(tx) {
  const size = new Blob([tx], {type : 'application/json'}).size;

  if (size < 1000)
    return `${size} bytes`;
  else if (size < 1000000)
    return `${size/1000} kB`;
  else {
    return `${size/1000000} MB`;
  }
}

function refreshCodeHighlightStyle() {
  const darkMode = $('body').hasClass('theme-dark');

  $('#light-code').prop('disabled', darkMode);
  $('#dark-code').prop('disabled', !darkMode);
}
