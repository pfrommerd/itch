<template>
  <div v-if="(horizontal || vertical)" class="container" v-bind:key="5">
    <splitpanes v-bind:horizontal="horizontal" class="default-theme" ref="split" v-bind:key="1">
      <div class="layer-container" v-bind:key="2">
        <div class="workspace-container" v-bind:key="3">
          <workspace v-bind:key="4"/>
        </div>
        <div id="tools">
          <div id="left" class="disappear"/>

          <div id="tools-vertical">
            <div id="top" class="disappear"/>
            <div v-if="horizontal" id="bottom" class="closer hovertool" v-on:click="closeSplit"/>
            <div v-else id="bottom" class="disappear" v-on:click="closeSplit"/>
          </div>

          <div v-if="vertical" id="right" class="closer hovertool" v-on:click="closeSplit"/>
          <div v-else id="right" class="disappear" v-on:click="closeSplit"/>
        </div>
      </div>
      <nesting v-bind:key="6"/>
    </splitpanes>
  </div>
  <!-- TODO: swapping not enabled since above block matches all -->
  <div v-else-if="(horizontal || vertical) && swap" class="container" v-bind:key="5">
    <splitpanes v-bind:horizontal="horizontal" class="default-theme" ref="split" v-bind:key="1">
      <nesting v-bind:key="6"/>
      <div class="layer-container" v-bind:key="2">
        <div class="workspace-container" v-bind:key="3">
          <workspace v-bind:key="4"/>
        </div>
        <div id="tools">
          <div v-if="vertical" id="left" class="closer hovertool" v-on:click="closeSplit"/>
          <div v-else id="left" class="disappear" v-on:click="closeSplit"/>

          <div id="tools-vertical">
            <div v-if="horizontal" id="top" class="closer hovertool" v-on:click="closeSplit"/>
            <div v-else id="top" class="disappear" v-on:click="closeSplit"/>
            <div id="bottom" class="disappear"/>
          </div>

          <div id="right" class="disappear"/>
        </div>
      </div>
    </splitpanes>
  </div>

  <div v-else class="container" v-bind:key="5">
    <splitpanes v-bind:horizontal="horizontal" class="default-theme" ref="split" v-bind:key="1">
      <div class="layer-container" v-bind:key="2">
        <div id="tools">
          <div id="left" class="splitter hovertool" v-on:click="splitLeft"/>
          <div id="tools-vertical">
            <div id="top" class="splitter hovertool" v-on:click="splitTop"/>
            <div id="bottom" class="splitter hovertool" v-on:click="splitBottom"/>
          </div>
          <div id="right" class="splitter hovertool" v-on:click="splitRight"/>
        </div>
        <div class="workspace-container" v-bind:key="3">
          <workspace v-bind:key="4"/>
        </div>
      </div>
    </splitpanes>
  </div>
</template>

<script>
  import Workspace from './Workspace'

  import Splitpanes from 'splitpanes'
  import 'splitpanes/dist/splitpanes.css'
  
  export default {
    name: 'nesting',
    components: {Workspace, Splitpanes},
    data: function() {
      return { horizontal: false, 
               vertical: false,
               swap: false };
    },
    methods: {
      splitLeft: function() {
        this.vertical = true;
        this.swap = true;
      },
      splitRight: function() {
        this.vertical = true;
        this.swap = false;
      },
      splitTop: function() {
        this.horizontal = true;
        this.swap = true;
      },
      splitBottom: function() {
        this.horizontal = true;
        this.swap = false;
      },
      closeSplit: function() {
        var pane = this.$refs['split']
        pane.panes[0].width = 100;
        pane.panes[0].savedWidth = 100;
        this.horizontal = false;
        this.vertical = false;
        this.swap = false;

      }
    }
  }
</script>

<style module>
.layer-container {
  width: 100%;
  height: 100%;
  display: grid;
}

#tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  grid-column: 1;
  grid-row: 1;
}

#tools-vertical {
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  align-self: stretch;
}

#tools > #left {
  justify-self: start;
  align-self: center;

  height: 60px;
  width: 40px;
  border-radius: 0 40px 40px 0;
}

#tools > #right {
  justify-self: end;
  align-self: center;

  height: 60px;
  width: 40px;
  border-radius: 40px 0 0 40px;
}

#tools-vertical > #top {
  justify-self: center;
  align-self: start;


  height: 40px;
  width: 60px;
  border-radius: 0 0 40px 40px;
}

#tools-vertical > #bottom {
  justify-self: center;
  align-self: end;

  height: 40px;
  width: 60px;
  border-radius: 40px 40px 0 0;
}

.hovertool {
  opacity: 0;
  z-index: 5000;
  transition: opacity 0.1s;
}
.hovertool:hover {
  opacity: 1;
}

.disappear {
  z-index: -100;
}

.closer {
  background-color: red;
}

.splitter {
  background-color: white;
  text-align: center;
  vertical-align: middle;
  display: table-cell;
}

.workspace-container {
  width: 100%;
  height: 100%;
  grid-column: 1;
  grid-row: 1;
  z-index: 100;
}
.container {
  width: 100%;
  height: 100%;
}
</style>
