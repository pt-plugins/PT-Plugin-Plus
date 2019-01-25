<template>
  <div>
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="name"
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.ver }}</td>
          <td>
            <a
              :href="props.item.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ props.item.url }}</a>
          </td>
        </template>
      </v-data-table>
    </v-card>
    <v-alert :value="true" color="grey">PT 助手的诞生是建立在这些项目基础之上，在此感谢所有项目的参与人员，感谢他们的付出！</v-alert>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      words: {
        title: "本项目使用或参考了以下项目"
      },
      headers: [
        { text: "名称", align: "left", value: "name" },
        { text: "版本", align: "left", value: "type" },
        { text: "网址", align: "left", value: "url" }
      ],
      pagination: {
        rowsPerPage: -1
      },
      items: [
        {
          name: "Vue",
          ver: "2.5.17",
          url: "https://github.com/vuejs/vue"
        },
        {
          name: "vue-router",
          ver: "3.0.1",
          url: "https://github.com/vuejs/vue-router"
        },
        {
          name: "vuex",
          ver: "3.0.1",
          url: "https://github.com/vuejs/vuex"
        },
        {
          name: "Vuetify",
          ver: "1.3.0",
          url: "https://github.com/vuetifyjs/vuetify"
        },
        {
          name: "Notice.js",
          ver: "0.4.0",
          url: "https://github.com/alihesari/notice.js"
        },
        {
          name: "FileSaver.js",
          ver: "2.0.0",
          url: "https://github.com/eligrey/FileSaver.js"
        },
        {
          name: "JavaScript MD5",
          ver: "2.10.0",
          url: "https://github.com/blueimp/JavaScript-MD5"
        },
        {
          name: "jQuery",
          ver: "1.9.1",
          url: "https://github.com/jquery/jquery"
        },
        {
          name: "webpack",
          ver: "4.26.1",
          url: "https://github.com/webpack/webpack"
        },
        {
          name: "TypeScript",
          ver: "3.2.2",
          url: "https://github.com/Microsoft/TypeScript"
        },
        {
          name: "Material design icons",
          ver: "3.0.0",
          url: "https://github.com/google/material-design-icons"
        },
        {
          name: "PT-Plugin Rhilip修改版",
          ver: "0.0.9",
          url: "https://github.com/Rhilip/PT-Plugin"
        },
        {
          name: "Jackett",
          ver: "latest",
          url: "https://github.com/Jackett/Jackett"
        }
      ]
    };
  }
});
</script>
