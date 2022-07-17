window.onload = async function () {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let ctx = document.getElementById("line-chart").getContext("2d");

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["popup.js"],
    function: showProductData(ctx, tab.url),
  });
};

function strToDate(dtStr) {
  if (!dtStr) return null;
  let dateParts = dtStr.split("-");
  let timeParts = dateParts[2].split(" ")[1].split(":");
  dateParts[2] = dateParts[2].split(" ")[0];
  // month is 0-based, that's why we need dataParts[1] - 1
  return (dateObject = new Date(
    +dateParts[2],
    dateParts[1] - 1,
    +dateParts[0],
    timeParts[0],
    timeParts[1],
    timeParts[2]
  ));
}

function showProductData(ctx, url) {
  const re = new RegExp("(?:[/dp/]|$)([A-Z0-9]{10})");
  const asinResults = url.match(re);

  fetch("https://mezarci.ucanbaklava.com/products/" + asinResults[1]) // 'data/data.json' in my case
    .then(function (response) {
      if (response.status !== 200) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }

      response.json().then(function (data) {
        console.log(data);
        const lowest = Math.min(...data.priceInfo.map((o) => o.price));
        const highest = Math.max(...data.priceInfo.map((o) => o.price));
        let size = "";
        let color = "";
        if (data.extraInfo !== null) {
          size =
            data.extraInfo.sizeInfo !== undefined
              ? "(" + data.extraInfo.sizeInfo + ")"
              : "";
          color =
            data.extraInfo.colorInfo !== undefined
              ? "(" + data.extraInfo.colorInfo + ")"
              : "";
        }

        const x = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [
              {
                data: data.priceInfo,
              },
            ],
          },
          options: {
            scales: {},
            onAnimationComplete: function () {
              var ctx = this.chart.ctx;
              ctx.font = Chart.helpers.fontString(
                Chart.defaults.global.defaultFontSize,
                "normal",
                Chart.defaults.global.defaultFontFamily
              );
              ctx.fillStyle = this.chart.config.options.defaultFontColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              this.data.datasets.forEach(function (dataset) {
                for (var i = 0; i < dataset.data.length; i++) {
                  var model =
                    dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
                  ctx.fillText(dataset.data[i], model.x, model.y - 5);
                }
              });
            },
            plugins: {
              title: {
                display: true,
                text: data.name + size + color,
              },
              afterDraw: (ctx) => {
                let xAxis = chart.scales["x-axis-0"];
                let yAxis = chart.scales["y-axis-0"];

                ctx.save();
                ctx.textAlign = "center";
                ctx.font = "12px Arial";
                ctx.fillStyle = "white";
                ctx.textAlign = "left";
                ctx.fillText(
                  "En Düşük = " + lowest,
                  xAxis.left + 5,
                  yAxis.top + 5
                );
                ctx.fillText(
                  "En Yüksek = " + highest,
                  xAxis.left + 5,
                  yAxis.top + 18
                );
                ctx.restore();
              },
            },
            parsing: {
              xAxisKey: "priceDate",
              yAxisKey: "price",
            },
          },
        });
      });
    })
    .catch(function (err) {
      console.log("Fetch Error :-S", err);
    });
}
