<template>
  <v-card class="mb-5" color="grey lighten-4">
    <v-card-text>
      <v-form v-model="data.valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="data.name"
          :label="words.name"
          :placeholder="words.name"
          required
          :rules="rules.require"
        ></v-text-field>

        <!-- 页面 -->
        <v-combobox
          v-model="data.pages"
          hide-selected
          :hint="words.pagesTip"
          :label="words.pages"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 附加脚本文件 -->
        <v-combobox
          v-model="data.scripts"
          hide-selected
          :hint="words.scriptsTip"
          :label="words.scripts"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 附加样式文件 -->
        <v-combobox
          v-model="data.styles"
          hide-selected
          :hint="words.stylesTip"
          :label="words.styles"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 脚本 -->
        <v-textarea
          v-model="data.script"
          :label="words.script"
          required
          :rules="rules.require"
          height="200"
        ></v-textarea>

        <!-- 样式 -->
        <v-textarea v-model="data.style" :label="words.style" height="200"></v-textarea>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import { Site } from "../../../../interface/common";
export default Vue.extend({
  data() {
    return {
      words: {
        defaultClient: "默认下载服务器",
        name: "插件名称",
        pages: "适用页面",
        pagesTip:
          "页面以'/'开始表示网站根目录，输入完成后按回车添加，可添加多个，可以是正则表达式",
        scripts: "附加脚本文件",
        scriptsTip: "/ 表示从资源目录根加载脚本，可添加多个",
        script: "JS脚本",
        style: "附加样式",
        styles: "附加样式文件",
        stylesTip: "/ 表示从资源目录根加载脚本，可添加多个"
      },
      rules: {
        require: [(v: any) => !!v || "!"]
      }
    };
  },
  props: {
    data: {
      type: Object,
      default: () => ({
        valid: false
      })
    }
  }
});
</script>

<style lang="scss">
.v-textarea {
  .v-text-field__slot {
    height: 100%;
    textarea {
      height: 100%;
    }
  }
}
</style>
