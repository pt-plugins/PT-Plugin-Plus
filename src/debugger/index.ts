import Vue from "vue";
import App from "./Index.vue";
import vuetifyService from "@/options/plugins/vuetify";
import { EModule, EAction } from "@/interface/enum";
import { IRequest } from "@/interface/common";

import Extension from "@/service/extension";

const extension = new Extension();

class Debugger {
  private vm: any;

  constructor() {
    vuetifyService.init("en");

    this.vm = new Vue({
      el: "#app",

      render: h => h(App)
    });

    this.initEvents();
  }

  private initEvents() {
    chrome.runtime.onConnect.addListener(port => {
      console.assert(port.name == EModule.debugger);
      port.onMessage.addListener((request: IRequest) => {
        console.log(request);
        if (request.action == EAction.pushDebugMsg) {
          this.add(request.data);
        }
      });
    });

    chrome.tabs.getCurrent((tab: any) => {
      console.log("debugTabId: %s", tab.id);
      extension.sendRequest(EAction.updateDebuggerTabId, null, tab.id);
    });
  }

  private add(msg: any) {
    this.vm.$children[0].add(msg);
  }
}

new Debugger();
