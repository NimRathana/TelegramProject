<template>
  <v-container class="fill-height d-flex flex-column justify-center align-center text-center">
    <v-icon icon="mdi-alert-circle-outline" size="64" color="error" class="mb-4" />
    <h1>404 - Page Not Found</h1>
    <p>The requested page <strong>{{ $route.fullPath }}</strong> does not exist.</p>
    <v-btn to="/" class="mt-4">Go Home</v-btn>
  </v-container>
</template>
