<template>
  <v-dialog
    v-model="dialog"
    persistent
    scrollable
    max-width="700"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="showButton"
        dark
        v-on="on"
        title="一键签到？"
        color="warning"
      >
        <v-icon>how_to_reg</v-icon>
        <span class="ml-2">一键签到？</span>
      </v-btn>
    </template>
    <v-card>
      <v-toolbar dark color="blue-grey darken-2">
        <v-toolbar-title>关于自动签到</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          flat
          color="success"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/frequently-asked-questions#%E4%B8%BA%E4%BB%80%E4%B9%88%E5%8A%A9%E6%89%8B%E6%B2%A1%E6%9C%89%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E5%8A%9F%E8%83%BD"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :title="$t('common.help')"
        >
          <v-icon>help</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text style="max-height: 80vh" class="pa-0">
        <v-alert :value="true" color="warning" class="ma-0">
          <div>
            感谢您使用助手，抱歉这里没有自动签到功能，如果您愿意，请阅读以下内容：
            <br />
            <br />- 首先，自动签到对站点来说属于“作弊”行为； <br />-
            其次，签到功能对站点来说目的是用来活跃人气，如果自动签到了，对站点来说没有任何作用；
            <br />-
            再次，签到功能一般具有奖励作用，如签到后给予一定的积分（魔力）；
            <br />- 最后，本人痛恨任何“薅羊毛”行为； <br />-
            综上所述，助手不会添加任何可以自动获取奖励的功能，现在不会有，将来也不会有；
            <br />
            <br />PS：如果您喜欢一个站点，请用行动表示支持，而不是把一切交给自动化脚本；
            <br />
            <br />那为什么有这个按钮？因为很多人问，不得已加上这个“功能”。
          </div>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="success" flat @click="hideButton">不再显示该按钮</v-btn>
        <v-btn color="error" flat @click="dialog = false">{{
          $t("common.close")
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      dialog: false,
      showButton: true
    };
  },

  methods: {
    hideButton() {
      this.showButton = false;
      this.$store.dispatch("updateViewOptions", {
        key: "AutoSignWarning",
        options: {
          showButton: false
        }
      });
      this.dialog = false;
    }
  },

  created() {
    let viewOptions = this.$store.getters.viewsOptions("AutoSignWarning", {
      showButton: true
    });
    Object.assign(this, viewOptions);
  }
});
</script>
