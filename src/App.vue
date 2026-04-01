<script setup>
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div>
      <RouterView></RouterView>
    </div>
  </el-config-provider>
</template>

<style scoped lang="scss"></style>
