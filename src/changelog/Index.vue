<template>
  <div class="main">
    <div class="header">PT-Plugin-Plus {{ version }} 更新日志</div>
    <div v-html="content" class="markdown-body"></div>
    <div class="footer" v-html="footer"></div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { APP, API } from "@/service/api";
import marked from "marked";
import { PPF } from "@/service/public";
export default Vue.extend({
  data() {
    return {
      content:
        "正在加载…… <br>（如长时间未能加载成功，请直接打开 https://github.com/ronggang/PT-Plugin-Plus/releases/ 前往查看。）",
      footer:
        "[项目主页](https://github.com/ronggang/PT-Plugin-Plus) - [使用说明](https://github.com/ronggang/PT-Plugin-Plus/wiki) - [常见问题](https://github.com/ronggang/PT-Plugin-Plus/wiki/frequently-asked-questions) - [意见反馈](https://github.com/ronggang/PT-Plugin-Plus/issues) - [打开助手](index.html) <br><img src='./assets/donate.png'/>",
      version: PPF.getVersion()
    };
  },

  created() {
    $.getJSON(API.latestReleases)
      .done((result: any) => {
        if (result && result.body) {
          this.content = this.parse(result.body);
        }
      })
      .fail((result: any) => {});

    this.content = marked(this.content);
    this.footer = marked(this.footer);
  },

  methods: {
    parse(content: string): string {
      let result = marked(
        content.replace(
          /(#)(\d+)/g,
          "[#$2](https://github.com/ronggang/PT-Plugin-Plus/issues/$2)"
        )
      );

      return result;
    }
  }
});
</script>

<style lang="scss">
a {
  text-decoration: none;
  color: #1976d2;
}

a:hover {
  color: #008c00;
}

.main {
  padding: 0 50px;
}

.header {
  padding: 10px;
  font-size: 30px;
  border-bottom: 1px #ccc solid;
}
.markdown-body {
  padding: 10px;
}

.footer {
  border-top: 1px #ccc dotted;
  margin: 10px;
  text-align: center;
  line-height: 30px;
}
</style>
