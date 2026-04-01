<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { adminLogin } from "@/api/admin";

const router = useRouter();
const userStore = useUserStore();

const loginFormRef = ref(null);
const loading = ref(false);
const rememberMe = ref(false);

const loginForm = reactive({
  username: "",
  password: "",
});

const loginRules = {
  username: [{ required: true, message: "请填写账号", trigger: "blur" }],
  password: [{ required: true, message: "请填写密码", trigger: "blur" }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const res = await adminLogin({
        username: loginForm.username,
        password: loginForm.password,
      });

      const token = res.data?.data?.token;
      if (!token) {
        ElMessage.error(res.data?.message || "登录失败");
        return;
      }

      userStore.setToken(token, {
        storage: rememberMe.value ? "local" : "session",
        studioId: res.data?.data?.studioId,
        role: res.data?.data?.role,
        username: res.data?.data?.username,
      });
      ElMessage.success("欢迎回来");
      router.push("/admin");
    } finally {
      loading.value = false;
    }
  });
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-wrapper">
          <img src="@/static/logo.png" alt="Logo" class="login-logo" />
        </div>
        <h2>创新工作室管理系统</h2>
        <div class="divider"></div>
        <p class="subtitle">重庆工业技术大学 · 创新驱动未来</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        label-width="0"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="账号 / 邮箱"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="登录密码"
            :prefix-icon="Lock"
            show-password
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="form-actions">
          <el-checkbox v-model="rememberMe">自动登录</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码?</el-link>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            plain
            class="submit-btn"
            :loading="loading"
            size="large"
            @click="handleLogin"
          >
            立即登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" :underline="false">立即申请</el-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url("@/static/bgImg.png") no-repeat center center;
  background-size: cover;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    // 使用微弱的蓝色渐变替代纯灰色遮罩
    background: radial-gradient(
      circle at center,
      rgba(64, 158, 255, 0.05) 0%,
      rgba(0, 0, 0, 0) 100%
    );
    backdrop-filter: blur(4px);
  }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 50px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);

  .login-header {
    text-align: center;
    margin-bottom: 40px;

    .logo-wrapper {
      margin-bottom: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: #f0f7ff;
      border-radius: 20px;

      .login-logo {
        width: 60px;
        height: 60px;
        object-fit: contain;
      }
    }

    h2 {
      margin: 0;
      color: #1a1a1a;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .divider {
      width: 40px;
      height: 4px;
      background: #409eff;
      margin: 12px auto;
      border-radius: 2px;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 24px;
    }

    :deep(.el-input__wrapper) {
      padding: 4px 12px;
      border-radius: 8px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: -8px 0 24px;

    .el-checkbox {
      height: auto;
      color: #595959;
    }
  }

  .submit-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    background: #409eff;
    border: none;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

    &:hover {
      background: #66b1ff;
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
    }
  }

  .login-footer {
    margin-top: 32px;
    text-align: center;
    font-size: 14px;
    color: #8c8c8c;

    .el-link {
      font-weight: 500;
    }
  }
}

// 适配移动端
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 40px 20px;
  }
}
</style>
