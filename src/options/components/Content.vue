<template>
  <v-content>
    <v-container fluid>
      <keep-alive>
        <router-view v-if="$route.meta.keepAlive"></router-view>
      </keep-alive>

      <router-view v-if="!$route.meta.keepAlive"></router-view>
    </v-container>
  </v-content>
</template>