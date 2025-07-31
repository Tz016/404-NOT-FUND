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
        <!-- 登录按钮：用一个不会导航的 index，避免影响 active -->
        <el-menu-item class="welcome" index="__auth__">
          <template v-if="auth.isLoggedIn">
            Welcome back, {{ auth.username }}
          </template>
          <template v-else>
            Login
          </template>
        </el-menu-item>

        <!-- Market 保持不变 -->
        <el-menu-item index="/market">Market</el-menu-item>

        <!-- Home 作为可点击标题 + 悬停下拉（只有 Transactions） -->
        <el-sub-menu index="home" class="home-sub-menu" trigger="hover" :show-timeout="0" :hide-timeout="120"
          popper-class="menu-dropdown">
          <template #title>
            <!-- 点击标题直接进 / ，并阻止默认展开点击 -->
            <div class="home-title" @click.stop="goHome">
              Home
            </div>
          </template>

          <el-menu-item id="drop-down-tab" style="border:none; background-color: #ffffff00;"
            index="/transactions">Transactions</el-menu-item>
          <el-menu-item index="home" style="display:none;"></el-menu-item>
        </el-sub-menu>
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
          <p style="opacity: 0.8; margin-bottom: 24px;">
            Signed in as <b>{{ auth.username }}</b>
          </p>
          <el-button type="danger" @click="onLogout"
            style="width: 100%; background-color: #ffd04b ; border-color: #ffd04b;">
            Logout
          </el-button>
        </template>
        <template v-else>
          <h3 style="margin-bottom: 16px;">Login</h3>
          <el-form @submit.prevent="onLogin" label-position="top">
            <el-form-item label="Username">
              <el-input v-model="loginName" placeholder="Enter your username" />
            </el-form-item>
            <el-button type="primary" style="width: 100%; background-color: #ffd04b; border-color: #ffd04b;"
              @click="onLogin" :disabled="!loginName?.trim()">
              Login
            </el-button>
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
import { usePortfolioStore } from './stores/portfolio'
import { useMarketStore } from './stores/market'

const marketStore = useMarketStore()
const portfolioStore = usePortfolioStore()

const router = useRouter()
const route = useRoute()

const drawerVisible = ref(false)
const loginName = ref('')

const auth = useAuthStore()

// 计算 active：在 / 或 /transactions* 时，激活 "home"；否则激活当前路径
const computeActive = (path) => {
  if (path === '/' || path.startsWith('/transactions')) return 'home'
  return path
}

const activeMenu = ref(computeActive(route.path))

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = computeActive(newPath)
  },
  { immediate: true }
)

// 菜单选择
function handleSelect(key) {
  if (key === '__auth__') {
    // 打开登录抽屉，不进行路由跳转
    drawerVisible.value = true
    return
  }
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

onMounted(async () => {
  window.__PM_EMITTER__?.on('open-auth-drawer', openDrawer)
  await portfolioStore.refreshPortfolio(100023)
  marketStore.prefetchPopular(50)
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

/* 登录菜单项：不让它出现底部边框 */
.welcome {
  cursor: pointer;
  transition: background-color .2s ease;
  border-bottom: none !important;
  font-weight: 500;
}

/* 顶部主菜单 */
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

/* Home 标题 */
.home-title {
  padding: 0 20px;
  line-height: 60px;
  cursor: pointer;
  user-select: none;
}

.home-title:hover {
  color: #ffd04b;
  background-color: transparent;
}

.home-title:active {
  font-weight: bold;
  color: #ffd04b;
}

#drop-down-tab {
  padding: 0 20px;
  line-height: 60px;
  cursor: pointer;
  user-select: none;
  color: white;
  transition: font-weight 0.2s, color 0.2s;
}

/* #el-id-3537-0{
  border:none !important;
  margin-top:-5px;
  padding-right:0;
} */

.home-sub-menu:avtive {
  background-color: transparent;
  color: #ffd04b;
  font-weight: bold;

}

#drop-down-tab:hover {
  color: #ffd04b;
  font-weight: bolder;
  background-color: transparent;

}
</style>
