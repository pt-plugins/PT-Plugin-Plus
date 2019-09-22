<template>
  <v-content>
    <v-container
      fluid
      :class="$vuetify.breakpoint.smAndDown?['pa-0']: $vuetify.breakpoint.md?['pa-1']:['pa-3']"
    >
      <keep-alive>
        <router-view v-if="$route.meta.keepAlive"></router-view>
      </keep-alive>

      <router-view v-if="!$route.meta.keepAlive"></router-view>
    </v-container>
  </v-content>
</template>