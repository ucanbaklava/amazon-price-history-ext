const notfication = document.getElementById("notification");
const thumb = document.getElementById("thumb");
const pricehistory = document.getElementById("pricehistory");
let thumbnail


document.addEventListener('DOMContentLoaded',function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {func: "thumbnail"}, function(response) {
            thumbnail = response
        });
    });
  });



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

  notfication.innerHTML = "";

  fetch("https://mezarci.ucanbaklava.com/products/" + asinResults[1]) // 'data/data.json' in my case
    .then(function (response) {
      if (response.status !== 200) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        notfication.innerHTML = "<p>Urun Bulunamadi</p>";
        return;
      }

      response.json().then(function (data) {
        console.log(data);
        thumb.src = thumbnail
        const lowest = Math.min(...data.priceInfo.map((o) => o.price));
        const highest = Math.max(...data.priceInfo.map((o) => o.price));

        pricehistory.innerHTML = `<span style="color:green">En Dusuk: ${lowest} TL</span> <span>En Yuksek: ${highest} TL</span>`;
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
            scales: {
              y: {
                title: {
                  display: true,
                  text: "Fiyat",
                },
                ticks: {
                  // Include a dollar sign in the ticks
                  callback: function (value, index, ticks) {
                    return value;
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Tarih",
                },
                ticks: {
                  maxRotation: 90,
                  minRotation: 90,
                  callback: function (value) {
                    const newVal = this.getLabelForValue(value);
                    const [day, month, year] = newVal
                      .toString()
                      .split(" ")[0]
                      .split("-");
                    const date = new Date(+year, month - 1, +day);
                    console.log(date);
                    return date.toLocaleDateString("tr-TR");
                  },
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: data.name + size + color,
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
