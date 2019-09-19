<template>
  <v-menu offset-y v-model="show">
    <template v-slot:activator="{ on }">
      <v-btn
        icon
        :small="small"
        v-on="on"
        :dark="dark"
        :class="['ma-0',mini?'btn-mini':'']"
        :title="title"
      >
        <v-icon :small="small">color_lens</v-icon>
      </v-btn>
    </template>
    <div v-for="(color, index) in colors" :key="index">
      <template v-if="color!='black'">
        <v-btn
          v-for="(value, n) in [4,3,2,1]"
          :key="`${index}.darken-${n}`"
          :color="`${color} darken-${value}`"
          class="white--text pa-0 ma-0"
          style="border-radius:0;min-width:30px;"
          small
          @click.stop="changeColor(`${color} darken-${value}`)"
        ></v-btn>

        <v-btn
          :color="color"
          class="white--text pa-0 ma-0"
          style="border-radius:0;min-width:30px;"
          small
          @click.stop="changeColor(color)"
        ></v-btn>

        <v-btn
          v-for="(value, n) in [1,2,3,4,5]"
          :key="`${index}.${n}`"
          :color="`${color} lighten-${value}`"
          class="white--text pa-0 ma-0"
          style="border-radius:0;min-width:30px;"
          small
          @click.stop="changeColor(`${color} lighten-${value}`)"
        ></v-btn>
      </template>
    </div>
  </v-menu>
</template>
<script lang="ts">
import Vue from "vue";

import { BASE_COLORS } from "@/interface/common";
export default Vue.extend({
  props: {
    dark: Boolean,
    title: String,
    mini: Boolean,
    small: Boolean
  },
  data() {
    return {
      colors: BASE_COLORS,
      show: false
    };
  },

  methods: {
    changeColor(color: string) {
      this.$emit("change", color);
    }
  },

  watch: {
    show() {
      if (this.show) {
        this.$emit("show");
      } else {
        this.$emit("hide");
      }
    }
  }
});
</script>