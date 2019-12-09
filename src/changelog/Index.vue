<template>
  <v-app id="inspire">
    <div :class="$vuetify.breakpoint.smAndDown ? '' : 'mx-5'">
      <div class="header">{{ version }} 更新日志</div>
      <div v-html="content" class="markdown-body"></div>
      <div class="footer">
        <div v-html="footer" class="mt-2"></div>
        <div>&copy; 栽培者 {{ year }}, 版本 {{ version }}</div>
        <div class="mt-1">
          <img src="/assets/donate.png" />
        </div>
      </div>
    </div>
  </v-app>
</template>
<script lang="ts">
import Vue from "vue";
import marked from "marked";
import { PPF } from "@/service/public";
export default Vue.extend({
  data() {
    return {
      content:
        "正在加载…… <br>（如长时间未能加载成功，请前往 https://github.com/ronggang/PT-Plugin-Plus/releases/ 查看发布说明。）",
      footer:
        "[项目主页](https://github.com/ronggang/PT-Plugin-Plus) - [使用说明](https://github.com/ronggang/PT-Plugin-Plus/wiki) - [常见问题](https://github.com/ronggang/PT-Plugin-Plus/wiki/frequently-asked-questions) - [意见反馈](https://github.com/ronggang/PT-Plugin-Plus/issues) - [打开助手](index.html)",
      version: PPF.getVersion(),
      failContent:
        "更新日志加载失败，请前往 https://github.com/ronggang/PT-Plugin-Plus/releases/ 查看发布说明",
      year: new Date().getFullYear()
    };
  },

  created() {
    $.getJSON(
      `https://api.github.com/repos/ronggang/PT-Plugin-Plus/releases/tags/${this.version}`
    )
      .done((result: any) => {
        if (result && result.body) {
          this.content = this.parse(result.body);
        } else {
          this.content = marked(this.failContent);
        }
      })
      .fail((result: any) => {
        this.content = marked(this.failContent);
      });

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
