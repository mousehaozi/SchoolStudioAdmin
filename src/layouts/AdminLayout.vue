<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Motion, AnimatePresence } from "motion-v";
import { useUserStore } from "@/stores/user";
import {
  ArrowDown,
  ChatDotRound,
  Collection,
  Document,
  Notification,
  Picture,
  Postcard,
  Reading,
  School,
  Setting,
  User,
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isCollapsed = ref(false);

function syncCollapse() {
  isCollapsed.value = window.innerWidth <= 960;
}

onMounted(() => {
  syncCollapse();
  window.addEventListener("resize", syncCollapse);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncCollapse);
});

const asideWidth = computed(() => (isCollapsed.value ? "64px" : "220px"));
const activeMenu = computed(() => route.path);

function goDefault() {
  router.push("/admin/banner");
}

function handleCommand(cmd) {
  if (cmd === "logout") {
    userStore.logout();
    router.push("/login");
  }
}
</script>

<template>
  <el-container class="admin-layout">
    <el-header class="admin-header">
      <div class="admin-header__left">
        <div class="admin-brand" @click="goDefault">
          <img src="@/static/logo.png" alt="Logo" class="admin-brand__logo" />
          <div class="admin-brand__text">
            <div class="admin-brand__sub">成果转移转化创新工作室</div>
          </div>
        </div>
      </div>

      <div class="admin-header__right">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="admin-user">
            <el-icon class="admin-user__icon"><User /></el-icon>
            <span class="admin-user__label">{{
              userStore.username || "管理员"
            }}</span>
            <el-icon class="admin-user__caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="admin-body">
      <el-aside class="admin-aside" :width="asideWidth">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          router
          class="admin-menu"
        >
          <el-menu-item
            v-if="userStore.role === 'SUPERADMIN'"
            index="/admin/account"
          >
            <el-icon><User /></el-icon>
            <span>账号系统</span>
          </el-menu-item>

          <el-menu-item
            v-if="userStore.role === 'SUPERADMIN'"
            index="/admin/studios"
          >
            <el-icon><School /></el-icon>
            <span>工作室管理</span>
          </el-menu-item>

          <el-menu-item
            v-if="userStore.role === 'SUPERADMIN'"
            index="/admin/banner"
          >
            <el-icon><Picture /></el-icon>
            <span>轮播图</span>
          </el-menu-item>

          <el-menu-item index="/admin/profile">
            <el-icon><Document /></el-icon>
            <span>工作室简介</span>
          </el-menu-item>

          <el-menu-item index="/admin/studio-intro-article">
            <el-icon><Postcard /></el-icon>
            <span>工作室简介图文</span>
          </el-menu-item>

          <el-menu-item index="/admin/news">
            <el-icon><Notification /></el-icon>
            <span>工作动态</span>
          </el-menu-item>

          <el-sub-menu index="cooperation">
            <template #title>
              <el-icon><Collection /></el-icon>
              <span>产教融合</span>
            </template>
            <el-menu-item index="/admin/topics">
              <el-icon><Collection /></el-icon>
              <span>主题管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/articles">
              <el-icon><Reading /></el-icon>
              <span>文章管理</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item
            v-if="userStore.role === 'SUPERADMIN'"
            index="/admin/chat"
          >
            <el-icon><ChatDotRound /></el-icon>
            <span>在线咨询</span>
          </el-menu-item>

          <el-menu-item
            v-if="userStore.role === 'SUPERADMIN'"
            index="/admin/system-configs"
          >
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="admin-main">
        <router-view v-slot="{ Component, route }">
          <AnimatePresence mode="wait">
            <Motion
              :key="route.path"
              as="div"
              class="main-content-motion"
              :initial="{ opacity: 0, x: 10 }"
              :animate="{ opacity: 1, x: 0 }"
              :exit="{ opacity: 0, x: -10 }"
              :transition="{ duration: 0.2 }"
            >
              <component :is="Component" />
            </Motion>
          </AnimatePresence>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.admin-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
}

.admin-brand {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-brand__logo {
  height: 48px;
  width: auto;
}

.admin-brand__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.admin-brand__main {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.admin-brand__sub {
  font-size: 12px;
  color: #909399;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.admin-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #303133;
  cursor: pointer;
}

.admin-user__icon {
  font-size: 16px;
}

.admin-user__caret {
  font-size: 12px;
  opacity: 0.7;
}

.admin-body {
  height: calc(100vh - 72px);
}

.admin-aside {
  background: #ffffff;
  border-right: 1px solid #ebeef5;
  transition: width 0.2s ease;
}

.admin-menu {
  border-right: none;
  height: 100%;
}

.admin-main {
  padding: 10px;
  height: 100%;
  overflow: auto;
}

.admin-main :deep(.page) {
  height: 100%;
}

.admin-main :deep(.page-card) {
  height: 100%;
}

.main-content-motion {
  height: 100%;
  width: 100%;
}
</style>
