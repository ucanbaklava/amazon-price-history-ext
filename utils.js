const thumbnail = document.getElementById("imgTagWrapperId").querySelector("img").src
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

        if (request.func == "thumbnail")
            sendResponse(thumbnail);
});