

<template>
<el-container style="height: 100vh;">
    <!-- Header -->
    <el-header height="60px" class="app-header">
      <div class="logo">
        <img src="/file.svg" alt="Logo" class="logo-img" />
        Portfolio Manager
      </div>
      <el-menu 
        mode="horizontal" 
        :default-active="activeMenu" 
        @select="handleSelect"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/add">Market</el-menu-item>
        <el-menu-item index="/">Home</el-menu-item>
        
      </el-menu>
    </el-header>

    <!-- Main Content -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

function handleSelect(key) {
  router.push(key)
}
</script>

<style scoped>

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* padding: 0 20px; */
  background-color: #000000;
  color: white;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-top: 5px;
}
.logo-img {
  height: 40px;
  margin-top:-5px;
  margin-right: 5px;
  vertical-align: middle;
}


.el-menu {
  background-color: transparent;
  color: white;
  justify-content: flex-end;
  width:50%;
}

.main-content {
  padding: 20px;
  background-color:	#1e1e1e;
}
</style>