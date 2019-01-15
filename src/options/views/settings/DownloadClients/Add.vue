<template>
  <div>
    <v-snackbar v-model="valid" top :timeout="3000" color="error">{{ words.validMsg }}</v-snackbar>
    <v-dialog v-model="show" max-width="800">
      <v-card>
        <v-card-title class="headline blue-grey darken-2" style="color:white">{{ words.title }}</v-card-title>

        <v-card-text>
          <v-stepper v-model="step">
            <v-stepper-header>
              <v-stepper-step :complete="step > 1" step="1">{{ words.titleStep1 }}</v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="2">{{ words.titleStep2 }}</v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
              <!-- 选择一个下载服务器 -->
              <v-stepper-content step="1">
                <v-autocomplete
                  v-model="selectedItem"
                  :items="items"
                  :label="words.validMsg"
                  :menu-props="{maxHeight:'auto'}"
                  :hint="selectedItem.description"
                  persistent-hint
                  return-object
                  single-line
                  item-text="name"
                  item-value="name"
                >
                  <template slot="selection" slot-scope="{ item }">
                    <v-list-tile-avatar>
                      <img :src="item.icon">
                    </v-list-tile-avatar>
                    <span v-text="item.name"></span>
                  </template>
                  <template slot="item" slot-scope="data" style>
                    <v-list-tile-avatar>
                      <img :src="data.item.icon">
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                      <v-list-tile-action-text>{{ data.item.ver }}</v-list-tile-action-text>
                    </v-list-tile-action>
                  </template>
                </v-autocomplete>
              </v-stepper-content>

              <!-- 站点配置 -->
              <v-stepper-content step="2">
                <Editor :option="selectedData"/>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-btn
            flat
            color="grey darken-1"
            href="https://github.com/ronggang/PT-Plugin-Plus/tree/master/resource/clients"
            target="_blank"
            v-show="step==1"
            rel="noopener noreferrer nofollow"
          >
            <v-icon>help</v-icon>
            <span class="ml-1">{{ words.helpMsg }}</span>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn flat color="grey darken-1" @click="step--" :disabled="step===1">
            <v-icon>navigate_before</v-icon>
            <span>{{ words.prevStep }}</span>
          </v-btn>
          <v-btn flat color="blue" @click="next(step)" v-show="step<stepCount">
            <span>{{ words.nextStep }}</span>
            <v-icon>navigate_next</v-icon>
          </v-btn>
          <v-btn
            flat
            color="success"
            @click="save"
            v-show="step===stepCount"
            :disabled="!selectedData.valid"
          >
            <v-icon>check_circle_outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import { Site, Options } from "@/interface/common";
import Vue from "vue";
import Editor from "./Editor.vue";
export default Vue.extend({
  components: {
    Editor
  },
  data() {
    return {
      words: {
        title: "新增下载服务器",
        titleStep1: "选择服务器类型",
        titleStep2: "详细配置",
        validMsg: "请选择一个服务器类型",
        helpMsg: "找不到想要的服务器类型？来这里添加吧！",
        nextStep: "下一步",
        prevStep: "上一步"
      },
      step: 1,
      show: false,
      stepCount: 2,
      selectedData: {} as any,
      selectedItem: {} as any,
      valid: false,
      items: this.$store.state.options.system.clients,
      options: this.$store.state.options
    };
  },
  props: {
    value: Boolean
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    show() {
      this.$emit("change", this.show);
      if (!this.show) {
        this.step = 1;
        this.selectedItem = { name: "" };
      }
    },
    value() {
      this.show = this.value;
    }
  },
  methods: {
    save() {
      this.$emit("save", this.selectedData);
      this.show = false;
    },
    next(step: number) {
      if (this.selectedItem && this.selectedItem.name) {
        this.selectedData = Object.assign({}, this.selectedItem);
        this.valid = false;
        this.step++;
      } else {
        this.valid = true;
      }
    }
  },
  created() {}
});
</script>
