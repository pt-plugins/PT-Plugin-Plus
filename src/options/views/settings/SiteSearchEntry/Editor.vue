<template>
  <v-card :color="$vuetify.dark ? '' : 'grey lighten-4'">
    <v-card-text>
      <v-form v-model="data.valid">
        <!-- 名称 -->
        <v-text-field
          ref="name"
          v-model="data.name"
          :label="$t('settings.siteSearchEntry.editor.name')"
          :placeholder="$t('settings.siteSearchEntry.editor.name')"
          required
          :rules="rules.require"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 入口页面 -->
        <v-text-field
          v-model="data.entry"
          :label="$t('settings.siteSearchEntry.editor.entry')"
          :placeholder="$t('settings.siteSearchEntry.editor.entry')"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 资源分类 -->
        <v-autocomplete
          v-if="category && category.length"
          v-model="data.categories"
          :items="category"
          :label="$t('settings.siteSearchEntry.editor.category')"
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

        <!-- 追加的查询字符串 -->
        <v-text-field
          v-model="data.queryString"
          :label="$t('settings.siteSearchEntry.editor.queryString')"
          :placeholder="$t('settings.siteSearchEntry.editor.queryString')"
          :disabled="!data.isCustom"
        ></v-text-field>

        <v-text-field
          v-model="data.parseScriptFile"
          :label="$t('settings.siteSearchEntry.editor.parseScriptFile')"
          :placeholder="$t('settings.siteSearchEntry.editor.parseScriptFile')"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- 脚本 -->
        <v-textarea
          v-model="data.parseScript"
          :label="$t('settings.siteSearchEntry.editor.parseScript')"
          height="200"
          :disabled="!data.isCustom"
        ></v-textarea>

        <!-- 种子列表定位选择器 -->
        <v-textarea
          v-model="data.resultSelector"
          :label="$t('settings.siteSearchEntry.editor.resultSelector')"
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
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      checked: [],
      categoryConfig: {} as SiteCategories
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
        this.data.categories.forEach((id: number | string) => {
          let cat: any = this.category.find((c: any) => {
            return c.id == id;
          });
          if (cat) {
            result.push(cat.key);
          }
        });
      }

      if (this.categoryConfig.appendToSearchKey) {
        this.data.appendToSearchKeyString = result.join("");
      } else {
        this.data.queryString = result.join("");
      }
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
            this.categoryConfig = item;
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
