<template>
  <v-dialog v-model="show" max-width="800">
    <v-card>
      <v-card-title class="headline blue-grey darken-2" style="color:white">编辑站点</v-card-title>

      <v-card-text>
        <SiteEditor :site="defaultSite"/>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="cancel">
          <v-icon>cancel</v-icon>
          <span class="ml-1">取消</span>
        </v-btn>
        <v-btn flat color="success" @click="save" :disabled="!defaultSite.valid">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">确认</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import SiteEditor from "./Editor.vue";
export default Vue.extend({
  components: {
    SiteEditor
  },
  data() {
    return {
      show: false,
      defaultSite: {}
    };
  },
  props: {
    value: Boolean,
    site: Object
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    show() {
      this.$emit("change", this.show);
    },
    value() {
      this.show = this.value;
      if (this.show) {
        this.defaultSite = Object.assign({}, this.site);
      }
    }
  },
  methods: {
    save() {
      this.$emit("save", this.defaultSite);
      this.show = false;
    },
    cancel() {
      this.show = false;
    }
  },
  created() {
    console.log("EditSite.created");
  },
  mounted() {
    console.log("EditSite.mounted");
  },
  updated() {
    console.log("EditSite.updated");
    // this.defaultSite = this.site;
  }
});
</script>
