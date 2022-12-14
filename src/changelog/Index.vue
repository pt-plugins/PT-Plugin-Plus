<template>
  <v-app id="inspire">
    <div :class="$vuetify.breakpoint.smAndDown ? '' : 'mx-5'">
      <div class="header">{{ version }} 更新日志</div>
      <div v-html="marked(content)" class="markdown-body"></div>
      <div class="footer">
        <div v-html="marked(footer)" class="mt-2"></div>
        <div>&copy; PT 助手 {{ year }}, 版本 {{ version }}</div>
      </div>
    </div>
  </v-app>
</template>
<script lang="ts">
import Vue from "vue";
import { marked } from "marked";
import { PPF } from "@/service/public";

// 重写 version，因为使用 getVersion 获取到的是 `v1.5.1` 或者 `v1.5.1.dc988f6`，需要重写为 `v1.5.1` 否则无法获取release信息
let MAIN_VERSION = PPF.getVersion();
const mainVersionMatch = MAIN_VERSION.match(/v(\d+\.\d+\.\d+)\.?(.*)/)
if (mainVersionMatch && mainVersionMatch[1]) {
  MAIN_VERSION = `v${mainVersionMatch[1]}`
}

export default Vue.extend({
  data() {
    return {
      content:
        "正在加载…… <br>（如长时间未能加载成功，请前往 https://github.com/pt-plugins/PT-Plugin-Plus/releases/ 查看发布说明。）",
      footer:
        "[项目主页](https://github.com/pt-plugins/PT-Plugin-Plus) - [使用说明](https://github.com/pt-plugins/PT-Plugin-Plus/wiki) - [常见问题](https://github.com/pt-plugins/PT-Plugin-Plus/wiki/frequently-asked-questions) - [意见反馈](https://github.com/pt-plugins/PT-Plugin-Plus/issues) - [打开助手](index.html)",
      version: MAIN_VERSION,
      failContent:
        "更新日志加载失败，请前往 https://github.com/pt-plugins/PT-Plugin-Plus/releases/ 查看发布说明",
      year: new Date().getFullYear()
    };
  },

  created() {
    fetch(`https://api.github.com/repos/pt-plugins/PT-Plugin-Plus/releases/tags/${this.version}`)
        .then(r => r.json())
        .then((result: any) => {
          this.content = this.parse(result.body);
        })
        .catch(() => {
          this.content = this.failContent;
        });
  },

  methods: {
    marked,
    parse(content: string): string {
      return content.replace(
        /(#)(\d+)/g,
        "[#$2](https://github.com/pt-plugins/PT-Plugin-Plus/issues/$2)"
      );
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

  p {
    margin: 0;
  }
}
</style>
