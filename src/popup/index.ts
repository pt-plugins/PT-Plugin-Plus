(function($) {
  $("#btnConfig").on("click", () => {
    chrome.runtime.sendMessage(
      {
        action: "openOptions"
      },
      () => {}
    );
  });

  $("#btnSystemLog").on("click", () => {
    chrome.runtime.sendMessage(
      {
        action: "openOptions",
        data: "system-logs"
      },
      () => {}
    );
  });
})(jQuery);
