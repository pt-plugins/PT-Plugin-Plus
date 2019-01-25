<template>
  <v-card color="grey lighten-4">
    <v-card-text>
      <v-form v-model="data.valid">
        <!-- 名称 -->
        <v-text-field
          ref="name"
          v-model="data.name"
          :label="words.name"
          :placeholder="words.name"
          required
          :rules="rules.require"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 入口页面 -->
        <v-text-field
          v-model="data.entry"
          :label="words.entry"
          :placeholder="words.entry"
          required
          :rules="rules.require"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 资源分类 -->
        <v-autocomplete
          v-if="category && category.length"
          v-model="data.categories"
          :items="category"
          :label="words.category"
          item-text="name"
          item-value="id"
          chips
          clearable
          multiple
          :disabled="!data.isCustom"
        >
          <template slot="selection" slot-scope="data">
            <v-chip
              small
              :selected="data.selected"
              close
              @input="remove(data.item)"
            >{{ data.item.name }}</v-chip>
          </template>
        </v-autocomplete>

        <v-text-field
          v-model="data.parseScriptFile"
          :label="words.parseScriptFile"
          :placeholder="words.parseScriptFile"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 脚本 -->
        <v-textarea
          v-model="data.parseScript"
          :label="words.parseScript"
          height="200"
          :disabled="!data.isCustom"
        ></v-textarea>

        <!-- 种子列表定位选择器 -->
        <v-textarea
          v-model="data.resultSelector"
          :label="words.resultSelector"
          height="80"
          :disabled="!data.isCustom"
        ></v-textarea>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import { Site, SiteCategories, SiteCategory } from "@/interface/common";
export default Vue.extend({
  data() {
    return {
      words: {
        name: "入口名称",
        entry: "入口页面",
        parseScript: "搜索结果解析脚本",
        parseScriptFile: "搜索结果解析脚本文件",
        resultSelector: "种子列表定位选择器",
        category: "资源分类（不选表示所有）"
      },
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      checked: []
    };
  },
  props: {
    data: {
      type: Object,
      default: () => ({
        valid: false
      })
    },
    site: Object
  },
  watch: {
    "data.categories"() {
      let result: string[] = [];
      if (
        this.data &&
        this.data.categories &&
        this.data.categories.length > 0
      ) {
        this.data.categories.forEach((id: number) => {
          let cat: any = this.category.find((c: any) => {
            return c.id == id;
          });
          if (cat) {
            result.push(cat.key);
          }
        });
      }

      this.data.queryString = result.join("&");
    }
  },
  methods: {
    remove(category: SiteCategory) {
      let index: number = this.data.categories.findIndex((item: any) => {
        return category.id === item.id;
      });

      if (index != -1) {
        this.data.categories.splice(index, 1);
      }
    }
  },
  computed: {
    /**
     * 获取当前可用类别
     */
    category(): SiteCategory[] {
      let site: Site = this.site;
      let result: SiteCategory[] = [];
      if (site.categories) {
        site.categories.find((item: SiteCategories) => {
          if (
            item.category &&
            (item.entry == "*" ||
              (this.data.entry && this.data.entry.indexOf(item.entry) > -1))
          ) {
            let key = item.result + "";
            item.category.forEach((category: SiteCategory) => {
              result.push(
                Object.assign(
                  {
                    key: key.replace(/\$id\$/gi, category.id + "")
                  },
                  category
                )
              );
            });
            return true;
          }
          return false;
        });
      }
      return result;
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
