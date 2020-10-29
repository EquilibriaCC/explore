let check = true
$(document).ready(function () {
	let channel = getQueryStringParam("channel");
	const hash = getQueryStringParam("hash");

	if (!channel || !isHash(hash)) {
		return (document.location.href = "./index.html");
	}
	channel = decodeURIComponent(channel);
	$.ajax({
		url: `${channel}/transactions/desc/${hash}`,
		dataType: "json",
		type: "GET",
		cache: "false",
		success: function (tx) {
			if (tx[0].type == 3) {
				check = false;
			}
			$("#Ktransaction").text(tx[0].hash);
			$("#type").append(getTxTypeBadge(tx[0].type));
			$("#previous").append(`
        <a href="./transaction.html?channel=${channel}&hash=${tx[0].prev}">
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
      $("#data").text(JSON.stringify(JSON.parse(tx[0].data), null, 4));

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
	async function checkCheck() {
		let x = 0
		while (true) {
			await new Promise(r => setTimeout(r, 100));
			if (x > 200) {
				break
			}
			if (!check) {
				return (document.location.href = "./contract.html?channel="+channel+"&hash="+hash)
			}
			x++
		}
	}
	checkCheck()
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