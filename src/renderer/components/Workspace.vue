<template>
  <div>
    foo
  </div>
</template>

<script>
  export default {
    name: 'workspace',
    components: { },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
</style>
