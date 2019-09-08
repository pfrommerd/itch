<template>
  <div id="app">
    <nesting ref="main"/>
  </div>
</template>

<script>
  import Nesting from './components/Nesting'
  export default {
    name: 'itch',
    components: {Nesting},
    mounted: function() {
    },
  }
</script>

<style>
  /* CSS */
  html {
    border: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
    font-family: Arial,sans-serif;
  }
  body {
    border: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
  }
  #app {
    width: 100%;
    height: 100%;
  }
</style>
