(function ($, window) {
  class App extends window.NexusPHPCommon {
    init() {
      this.initSayThankButton();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化说谢谢按钮
     */
     initSayThankButton() {
      var val = $("#saythanks").is(":disabled");
      let sayThanksButton =  $("#saythanks");
      if (!val && sayThanksButton.length) {
        // 说谢谢
        PTService.addButton({
          title: this.t("buttons.sayThanksTip"),
          icon: "thumb_up",
          label: this.t("buttons.sayThanks"),
          key: "sayThanks",
          click: (success, error) => {
            sayThanksButton.trigger("click");
            success();
            setTimeout(() => {
              PTService.removeButton("sayThanks");
            }, 1000);
          }
        });
      }
    }
  }
  (new App()).init();
})(jQuery, window);
