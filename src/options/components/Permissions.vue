<template>
  <v-layout class="mt-3">
    <v-flex xs12 sm8 offset-sm2>
      <v-card>
        <v-img src="./assets/banner/default.jpg" aspect-ratio="2.75"></v-img>

        <v-card-title class="pb-1">
          <div v-if="!cancelled">
            <h3 class="title mb-2">{{ words.title }}</h3>
            <h3>{{ words.subtitle }}</h3>

            <v-data-table
              v-model="selected"
              :headers="headers"
              :items="items"
              item-key="key"
              select-all
              hide-actions
            >
              <template v-slot:items="props">
                <td>
                  <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
                </td>
                <td>{{ props.item.title }}</td>
                <td>
                  <v-switch
                    true-value="true"
                    false-value="false"
                    :input-value="props.item.enabled?'true':'false'"
                    hide-details
                    @click.stop="updatePermissions(props.item)"
                  ></v-switch>
                </td>
              </template>
            </v-data-table>
            <div class="mt-1 ml-3">
              <li
                class="subheading"
                v-for="(item, index) in words.permissions"
                :key="index"
              >{{item}}</li>
            </div>
          </div>

          <div v-else class="title mb-2">{{ words.cancelled }}</div>
        </v-card-title>

        <v-card-actions v-if="!cancelled">
          <v-btn
            flat
            color="success"
            :disabled="selected.length==0"
            @click="authorize"
          >{{ words.authorize }}</v-btn>
          <v-btn flat color="orange" @click="cancel">{{ words.cancel }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      words: {
        title: "感谢您选择 PT 助手",
        subtitle: "为了不影响正常使用，请对需要的功能进行授权：",
        authorize: "授权",
        cancel: "我不用了",
        cancelled: "世界如此之大，期待有缘再相会！"
      },
      permissions: [
        {
          key: "*://*/*",
          title: "所有网站的访问权限，用于搜索和读取做种数据；",
          isOrigin: true
        },
        { key: "tabs", title: "活动选项卡的读取权限，用于显示助手图标；" },
        { key: "downloads", title: "下载权限，用于批量下载种子文件" }
      ],
      selected: [] as any,
      headers: [
        {
          text: "权限描述",
          align: "left",
          sortable: false,
          value: "title"
        },
        { text: "已授权", align: "left", value: "enabled", sortable: false }
      ],
      cancelled: false,
      items: [] as any
    };
  },
  methods: {
    /**
     * 发起用户授权
     */
    authorize() {
      if (chrome && chrome.permissions) {
        let options = {
          permissions: [] as any,
          origins: [] as any
        };
        this.selected.forEach((item: any) => {
          if (item.isOrigin) {
            options.origins.push(item.key);
          } else {
            options.permissions.push(item.key);
          }
        });
        // 权限必须在用户操作下请求，例如按钮单击的事件处理函数。
        chrome.permissions.request(options, granted => {
          this.$emit("update", granted);
        });
      } else {
        this.$emit("update", true);
      }
    },
    cancel() {
      this.cancelled = true;
    },
    updatePermissions(item: any) {
      item.enabled = !(<boolean>item.enabled);
      let options = {};
      if (item.isOrigin) {
        options = {
          origins: [item.key]
        };
      } else {
        options = {
          permissions: [item.key]
        };
      }
      if (item.enabled) {
        chrome.permissions.request(options, granted => {
          item.enabled = granted;
        });
      } else {
        chrome.permissions.remove(options, granted => {
          item.enabled = !granted;
        });
      }

      console.log(item);
    }
  },
  created() {
    if (chrome && chrome.permissions) {
    } else {
      this.items = this.permissions;
      return;
    }
    this.permissions.forEach(item => {
      let options = {};
      if (item.isOrigin) {
        options = {
          origins: [item.key]
        };
      } else {
        options = {
          permissions: [item.key]
        };
      }
      // 查询当前权限
      chrome.permissions.contains(options, result => {
        this.items.push(Object.assign({ enabled: result }, item));
      });
    });
  }
});
</script>
<style lang="scss" scoped>
.item {
  padding: 5px;
}

.logo {
  position: absolute;
  right: 20px;
  bottom: 60px;
  opacity: 0.5;
}
</style>
