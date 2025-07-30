<template>
  <el-container style="height: 100vh;">
    <!-- Header -->
    <el-header height="60px" class="app-header">

      <div class="logo" @click="goHome">
        <img src="/file.svg" alt="Logo" class="logo-img" />
        Portfolio Manager



      </div>

      <el-menu mode="horizontal" :default-active="activeMenu" @select="handleSelect" background-color="#545c64"
        text-color="#fff" active-text-color="#ffd04b">
        <el-menu-item class="welcome" index="/" @click="drawerVisible = true">
          <template v-if="auth.isLoggedIn">
            Welcome back, {{ auth.username }}
          </template>
          <template v-else>
            Login
          </template>
        </el-menu-item>
        <el-menu-item index="/market">Market</el-menu-item>
        <el-menu-item index="/">Home</el-menu-item>
      </el-menu>
    </el-header>

    <!-- Main Content -->
    <el-main class="main-content">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </el-main>

    <!-- Drawer：登录/登出 -->
    <el-drawer v-model="drawerVisible" :with-header="false" size="320px">
      <div class="drawer-content">
        <template v-if="auth.isLoggedIn">
          <h3 style="margin-bottom: 16px;">Account</h3>
          <p style="opacity: 0.8; margin-bottom: 24px;">Signed in as <b>{{ auth.username }}</b></p>
          <el-button type="danger" @click="onLogout"
            style="width: 100%; background-color: #ffd04b ; border-color: #ffd04b;">Logout</el-button>
        </template>
        <template v-else>
          <h3 style="margin-bottom: 16px;">Login</h3>
          <el-form @submit.prevent="onLogin" label-position="top">
            <el-form-item label="Username">
              <el-input v-model="loginName" placeholder="Enter your username" />
            </el-form-item>
            <el-button type="primary" style="width: 100%; background-color: #ffd04b; border-color: #ffd04b;"
              @click="onLogin" :disabled="!loginName?.trim()">Login</el-button>
          </el-form>
        </template>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)
const drawerVisible = ref(false)
const loginName = ref('')

const auth = useAuthStore()

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

// 菜单切换
function handleSelect(key) {
  router.push(key)
}
function openDrawer() {
  drawerVisible.value = true
}

function goHome() {
  router.push('/')
}

// 登录/登出
function onLogin() {
  const name = loginName.value.trim()
  if (!name) return
  auth.login(name)
  loginName.value = ''
  drawerVisible.value = false
}
function onLogout() {
  auth.logout()
  drawerVisible.value = false
}
onMounted(() => {
  window.__PM_EMITTER__?.on('open-auth-drawer', openDrawer)
})

onUnmounted(() => {
  window.__PM_EMITTER__?.off('open-auth-drawer', openDrawer)
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin-top: -5px;
  margin-right: 5px;
  vertical-align: middle;
}

.welcome {
  cursor: pointer;
  transition: background-color .2s ease;
  border-bottom: none !important;
  font-weight: 500;
}


.el-menu {
  background-color: transparent;
  color: white;
  justify-content: flex-end;
  width: 60%;
}

.main-content {
  padding: 20px;
  background-color: #111111;
}

.drawer-content {
  padding: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
