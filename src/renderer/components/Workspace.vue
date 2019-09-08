<template>
  <div class="layers">
    <div class="workspace" ref="workspace" style="width:100%" v-on:click="focus()"/>
    <div class="overlay" v-bind:class="{invisible: module && module.length > 0}">
      <div class="overlay-panel">
        <div class="overlay-buttons">
          <div class="overlay-button" v-for="m in availableModules" v-on:click="load(m)">{{ m }}</div>
        </div>
        <div class="overlay-add">
          <input type="text" v-model="newName" placeholder="New Module Name"></input>
          <span class="overlay-add-button" v-on:click="createNew(newName)">Create New</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {modules, bind, createEditor, focusEditor, loadEditor, saveEditor} from './workspace.js'
import 'vue2-toast/lib/toast.css';
import Toast from 'vue2-toast';
import Vue from 'vue';
Vue.use(Toast, {
    type: 'center',
    duration: 3000,
    wordWrap: true,
    width: '150px'
});

export default {
  name: 'workspace',
  components: {},
  data: function() {
    return { module: '',
             loading: false,
             newName: '',
             availableModules: [],
             editor: null }
  },
  update: function() {
  },
  methods: {
    createNew: function(name) {
      if (!name || name.length == 0) return;

      try {
        createEditor(name, this.editor);
        this.module = name;
      } catch (e) {
        console.error('failed to load:', e);
      }
    },
    exit: function() {
      this.module = '';
    },
    load: function(name) {
      (async() => {
        try {
          this.loading = true;
          await loadEditor(name, this.editor);
          this.loading = false;
          this.module = name;
        } catch (e) {
          console.error('failed to load', e);
        }
      })();
    },
    note: function(text) {
      this.$toast.bottom(text);
    },
    edited: function() {
      if (!this.loading) this.save();
    },
    save: function() {
      if (!this.module) return;
      try {
        saveEditor(this.module, this.editor);
      } catch (e) {
        console.error('failed to save', e);
      }
    },
    focus() {
      focusEditor(this.editor);
    }
  },
  mounted: function() {
    var container = this.$el.childNodes[0]
    this.$nextTick(() => {
      [this.editor, this.availableModules] = bind(container, this)
      modules.anyChange((name, cause) => {
        if (cause == this.editor) return;
        if (name == this.module) this.load(this.module);
      });
    });
  }
}
</script>

<style module>
  .workspace {
    position: relative;
    left: 0px;
    right: 0px;
    width: 100%;
    height: 100%;
    grid-column: 1;
    grid-row: 1;
  }
  .notifications {
    position: absolute;
    left: 0px;
    right: 0px;
    width: 100%;
    height: 100%;
    z-index: -100;
  }
  .note {
    position: static;
    left: 50%;
    bottom: 0%;
    width: 100px;
    height: 50px;
    background-color: #ddd;
    z-index: 20000;
  }
  .dirty {
    border-width: 5px;
    border-style: solid;
    border-color: #FFBA00;
  }

  .layers {
    width: 100%;
    height: 100%;
    display: grid;
    background-color: #eee;
  }
  .overlay {
    position: relative;
    left: 0px;
    top: 0px;

    width: 100%;
    height: 100%;

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: #444;
    opacity: 0.7;
    overflow: hidden;
    z-index: 100;
    grid-column: 1;
    grid-row: 1;
  }
  .overlay-panel {
    padding: 20px;
    border-radius: 5px;
    background-color: #ccc;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    min-width: 20%;
  }
  .overlay-buttons {
    display: flex;
    margin-bottom: 20px;
  }

  .overlay-button {
    background-color: #00e;
    padding: 10px 15px 10px 15px;
    border-radius: 5px;
    color: #eee;
    margin: 3px 5px 5px 3px;
  }
  .overlay-add-button {
    padding: 10px 15px 10px 15px;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    border-color: #00e;
    color: #00e;
  }
  .invisible {
    z-index: -1000;
  }
</style>
