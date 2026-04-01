<script setup></script>

<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-title">管理面板</div>
      </template>
      <el-text type="info">从左侧菜单进入各模块。</el-text>
    </CommonCard>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
}
.page-title {
  font-weight: 700;
}
</style>
