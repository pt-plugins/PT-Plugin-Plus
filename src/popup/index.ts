(function($) {
  $("#btnConfig").on("click", () => {
    chrome.runtime.sendMessage(
      {
        action: "openOptions"
      },
      () => {}
    );
  });
})(jQuery);
