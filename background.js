chrome.action.disable();

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(() => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: chrome.runtime.getManifest().host_permissions.map(h => {
        const [, sub, host] = h.match(/:\/\/(\*\.)?([^/]+)/);
        return new chrome.declarativeContent.PageStateMatcher({
          pageUrl: sub ? {hostSuffix: '.' + host} : {hostEquals: host},
        });
      }),
      actions: [new chrome.declarativeContent.ShowAction()],
    }]);
  });
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: getProduct,
    });
  }
});

function getProductHistory() {
  const re = new RegExp("(?:[/dp/]|$)([A-Z0-9]{10})");
  const asinResults = window.location.toString().match(re);

  const req = new XMLHttpRequest();
  const baseUrl = "https://mezarci.ucanbaklava.com/products";
  let result;
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      result = xhr.responseText;
    }
  };
  xhr.open("GET", baseUrl + "/" + asinResults[1], true);
  xhr.send(null);

  console.log(result);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const baseUrl = "https://mezarci.ucanbaklava.com/products";
  let result;
  fetch("https://mezarci.ucanbaklava.com/products/" + request.asin).then(
    (response) => {
      sendResponse(response.json());
    }
  );
});

function getProduct() {
  const re = new RegExp("(?:[/dp/]|$)([A-Z0-9]{10})");
  const marketplaceIDRegex = new RegExp("marketplaceID=(.*?)&amp");
  const brandRegex = new RegExp("(?<=Marka: ).*");
  const depositRegex = new RegExp("(?<=\\+ )(.*)(?=&nbsp;)");
  const deliveryRegex = new RegExp(".*(?=TL)");

  const priceRegex = new RegExp('(?<=priceAmount":)([^]*?)(?=,)');
  const formatter = new Intl.NumberFormat("tr-TR", {
    maximumSignificantDigits: 10,
  });

  const asinResults = window.location.toString().match(re);

  const productImages = document.getElementsByClassName(
    "a-spacing-small item imageThumbnail a-declarative"
  );
  const title = document.getElementById("productTitle").innerText;
  const specsQuerySelector = document.querySelectorAll(
    "#productDetails_techSpec_section_1>tbody>tr"
  );

  const aboutQuerySelector = document.querySelectorAll(
    ".a-unordered-list.a-vertical.a-spacing-mini>li"
  );
  const deliveryQuerySelector = document.querySelectorAll(
    '[data-csa-c-content-id="DEXUnifiedCXPDM"]'
  );
  const priceQuerySelector = document.getElementsByClassName(
    "a-section aok-hidden twister-plus-buying-options-price-data"
  );

  const merchantQuerySelector = document.getElementById("merchant-info");
  const brandQuerySelector = document.getElementById("bylineInfo");
  const sizeInfo = document.getElementById(
    "native_dropdown_selected_size_name"
  );
  const colorInfo = document.getElementById("variation_color_name");

  const price = () => {
    if (priceQuerySelector !== null) {
      let productPrice = priceQuerySelector[0].innerText.match(priceRegex);
      if (productPrice === null) return 0;
      else return parseFloat(productPrice[0]);
    }
  };

  const delivery = () => {
    if (deliveryQuerySelector !== null) {
      let deliveryPrice =
        deliveryQuerySelector[0].innerText.match(deliveryRegex);
      if (deliveryPrice === null) return 0;
      else return parseFloat(deliveryPrice[0].trim().replace(",", "."));
    } else return 0;
  };
  const extraInfo = () => {
    let info = {};
    if (sizeInfo !== null) {
      info.sizeInfo = sizeInfo.options[sizeInfo.selectedIndex].text;
    }
    if (colorInfo !== null) {
      info.colorInfo = colorInfo.querySelector(".selection").innerText;
    }

    return info;
  };

  const brand = () => {
    if (brandQuerySelector === null) return "";
    else {
      return brandQuerySelector.innerText.match(brandRegex) === null
        ? ""
        : brandQuerySelector.innerText.match(brandRegex)[0];
    }
  };

  const deposit = () => {
    const depositTag = document.getElementById("priceblock_ourprice_ifdmsg");
    if (depositTag === null) {
      return 0;
    } else {
      return parseFloat(
        depositTag.innerHTML.match(depositRegex)[0].replace(",", ".")
      );
    }
  };

  const merchandID =
    merchantQuerySelector.innerHTML.match(marketplaceIDRegex) === null
      ? null
      : merchantQuerySelector.innerHTML.match(marketplaceIDRegex)[1];

  const productImageArray = () => {
    imageArray = [];
    for (var i = 0; i < productImages.length; i++) {
      imageArray.push(productImages[i].getElementsByTagName("img")[0].src);
    }

    return imageArray;
  };

  const about = () => {
    aboutArray = [];
    aboutQuerySelector.forEach((x) => aboutArray.push(x.innerText));
    return aboutArray;
  };
  const product = {
    name: title,
    asin: asinResults[1],
    delivery: delivery(),
    deposit: deposit(),
    price: price(),
    about: about(),
    images: productImageArray(),
    brand: brand(),
    extraInfo: extraInfo(),
    priceInfo: [
      {
        price: price(),
        merchant:
          merchantQuerySelector.getElementsByTagName("span")[0].innerText,
        merchandID:
          merchandID === "" || merchandID == undefined || merchandID == null
            ? "0"
            : merchandID,
        delivery: delivery(),
        deposit: deposit(),
      },
    ],
  };

  const req = new XMLHttpRequest();
  const baseUrl = "https://mezarci.ucanbaklava.com/product";

  req.open("POST", baseUrl);
  req.setRequestHeader("Content-type", "application/json");
  req.setRequestHeader(
    "Access-Control-Allow-Origin",
    "https://www.amazon.com.tr"
  );
  req.send(JSON.stringify(product));

  console.log(JSON.stringify(product));
}
