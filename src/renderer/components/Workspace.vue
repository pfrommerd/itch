<template>
  <div class="container">
    <div class="overlay">
    </div>
    <div class="workspace" ref="workspace" style="width:100%">
    </div>
  </div>
</template>

<script>
import {mount} from './workspace.js'

export default {
  name: 'workspace',
  components: { },
  data: function() {
    return { module: String,
             dirty: false }
  },
  update: function() {
  },
  methods: {
  },
  mounted: mount
}
</script>

<style module>
  .workspace {
    width: 100%;
    height: 100%;
  }
  .container {
    width: 100%;
    height: 100%;
  }
</style>
