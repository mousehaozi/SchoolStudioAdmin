<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Key,
  MoreFilled,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";
import {
  getAdminSysUsers,
  createAdminSysUser,
  updateAdminSysUser,
  resetAdminSysUserPassword,
  deleteAdminSysUser,
  disableAdminSysUser,
  getAdminStudios,
} from "@/api/admin";
import { formatDate as genericFormatDate } from "@/utils/format";

const loading = ref(false);
const saving = ref(false);
const total = ref(0);
const records = ref([]);
const page = ref(1);
const size = ref(10);

const studioList = ref([]);
const studioMap = ref({});

const filters = reactive({
  username: "",
  role: "",
  enableStatus: "",
});

// 列表获取
async function fetchPage() {
  loading.value = true;
  // 先获取工作室列表，方便回显或其他逻辑
  try {
    const sRes = await getAdminStudios();
    const list = sRes.data?.data || [];
    studioList.value = list;
    studioMap.value = {};
    list.forEach((s) => {
      studioMap.value[s.id] = s.name;
    });
  } catch (e) {
    console.error("获取工作室失败", e);
  }

  try {
    const res = await getAdminSysUsers({
      page: page.value,
      size: size.value,
      ...filters,
    });
    const data = res.data?.data || {};
    records.value = data.records || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error("获取用户列表失败", error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchPage();
}

function resetFilters() {
  filters.username = "";
  filters.role = "";
  filters.enableStatus = "";
  handleSearch();
}

// 新增相关
const createVisible = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  username: "",
  password: "",
  phone: "",
  role: "ADMIN",
  studioId: "",
});
const createRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度至少6位", trigger: "blur" },
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
};

function openCreate() {
  createForm.username = "";
  createForm.password = "";
  createForm.phone = "";
  createForm.role = "ADMIN";
  createForm.studioId = "";
  createVisible.value = true;
}

async function submitCreate() {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        await createAdminSysUser({
          ...createForm,
          // 如果选择空字符串转为 null
          studioId: createForm.studioId || null,
        });
        ElMessage.success("创建成功");
        createVisible.value = false;
        fetchPage();
      } finally {
        saving.value = false;
      }
    }
  });
}

// 编辑相关
const editVisible = ref(false);
const editForm = reactive({
  id: "",
  username: "",
  phone: "",
  role: "",
  enableStatus: 1,
  studioId: "",
});

function openEdit(row) {
  editForm.id = row.id;
  editForm.username = row.username;
  editForm.phone = row.phone || "";
  editForm.role = row.role;
  editForm.enableStatus = row.enableStatus;
  editForm.studioId = row.studioId || "";
  editVisible.value = true;
}

async function submitEdit() {
  saving.value = true;
  try {
    await updateAdminSysUser(editForm.id, {
      phone: editForm.phone,
      role: editForm.role,
      enableStatus: editForm.enableStatus,
      studioId: editForm.studioId || null,
    });
    ElMessage.success("更新成功");
    editVisible.value = false;
    fetchPage();
  } finally {
    saving.value = false;
  }
}

// 重置密码相关
const pwdVisible = ref(false);
const pwdFormRef = ref(null);
const pwdForm = reactive({
  userId: "",
  username: "",
  password: "",
});
const pwdRules = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "长度需不小于6位", trigger: "blur" },
  ],
};

function openResetPwd(row) {
  pwdForm.userId = row.id;
  pwdForm.username = row.username;
  pwdForm.password = "";
  pwdVisible.value = true;
}

async function submitResetPwd() {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        await resetAdminSysUserPassword({
          userId: pwdForm.userId,
          password: pwdForm.password,
        });
        ElMessage.success("密码重置成功");
        pwdVisible.value = false;
      } finally {
        saving.value = false;
      }
    }
  });
}

// 状态切换
async function toggleStatus(row) {
  const action = row.enableStatus === 1 ? "禁用" : "启用";
  try {
    await ElMessageBox.confirm(`确认${action}用户 "${row.username}"?`, "提示", {
      type: "warning",
    });

    if (row.enableStatus === 1) {
      await disableAdminSysUser(row.id);
    } else {
      // 启用可以通过更新用户信息实现
      await updateAdminSysUser(row.id, {
        enableStatus: 1,
        role: row.role,
        phone: row.phone,
      });
    }

    ElMessage.success(`${action}成功`);
    fetchPage();
  } catch (error) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
}

// 删除用户
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认彻底删除用户 "${row.username}"? 此操作不可恢复！`,
      "危险操作",
      {
        type: "error",
        confirmButtonText: "确定删除",
        confirmButtonClass: "el-button--danger",
      }
    );
    await deleteAdminSysUser(row.id);
    ElMessage.success("删除成功");
    fetchPage();
  } catch (error) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
}

// 时间格式化
function formatTime(time) {
  return genericFormatDate(time);
}

onMounted(() => {
  fetchPage();
});
</script>

<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div class="page-title">账号管理</div>
          <div class="page-actions">
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              @click="fetchPage"
              >刷新</el-button
            >
            <el-button type="primary" :icon="Plus" @click="openCreate"
              >新增用户</el-button
            >
          </div>
        </div>
      </template>

      <!-- 筛选工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="filters.username"
          placeholder="用户名"
          clearable
          style="max-width: 200px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="filters.role"
          placeholder="角色"
          clearable
          style="max-width: 150px"
          @change="handleSearch"
        >
          <el-option label="管理员" value="ADMIN" />
          <el-option label="普通用户" value="USER" />
        </el-select>
        <el-select
          v-model="filters.enableStatus"
          placeholder="状态"
          clearable
          style="max-width: 150px"
          @change="handleSearch"
        >
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
        <el-button type="primary" plain :icon="Search" @click="handleSearch"
          >查询</el-button
        >
        <el-button :icon="Delete" plain @click="resetFilters">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="records" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column label="微信信息" min-width="180">
          <template #default="{ row }">
            <div
              v-if="row.wechatNickname || row.wechatAvatar"
              class="user-profile"
            >
              <el-avatar
                v-if="row.wechatAvatar"
                :size="32"
                :src="row.wechatAvatar"
              />
              <span class="nickname">{{ row.wechatNickname || "-" }}</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            {{ row.phone || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag
              :type="
                row.role === 'SUPERADMIN'
                  ? 'primary'
                  : row.role === 'ADMIN'
                    ? 'success'
                    : 'info'
              "
              size="small"
              effect="dark"
            >
              {{
                row.role === "SUPERADMIN"
                  ? "超级管理员"
                  : row.role === "ADMIN"
                    ? "管理员"
                    : "用户"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studioName" label="关联工作室" min-width="150">
          <template #default="{ row }">
            {{ row.studioName || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="enableStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.enableStatus === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.enableStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.registerTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="180">
          <template #default="{ row }">
            {{ formatTime(row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button size="small" plain :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Edit" @click="openEdit(row)">
                    编辑资料
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Key" @click="openResetPwd(row)">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item
                    :icon="row.enableStatus === 1 ? VideoPause : VideoPlay"
                    @click="toggleStatus(row)"
                  >
                    {{ row.enableStatus === 1 ? "禁用账号" : "启用账号" }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    :icon="Delete"
                    style="color: #f56c6c"
                    @click="handleDelete(row)"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <template #footer>
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="size"
            background
            layout="total, prev, pager, next, sizes"
            :total="total"
            :page-sizes="[10, 20, 50]"
            @change="fetchPage"
          />
        </div>
      </template>
    </CommonCard>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editVisible"
      title="编辑用户信息"
      width="450px"
      align-center
    >
      <el-form
        :model="editForm"
        label-width="100px"
        style="padding-right: 20px"
      >
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.enableStatus">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联工作室">
          <el-select
            v-model="editForm.studioId"
            style="width: 100%"
            placeholder="请选择"
            clearable
          >
            <el-option
              v-for="item in studioList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="pwdVisible"
      title="重置用户密码"
      width="400px"
      align-center
    >
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="100px"
        style="padding-right: 20px"
      >
        <el-form-item label="用户名">
          <el-input v-model="pwdForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="pwdForm.password"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          plain
          @click="submitResetPwd"
          >确认重置</el-button
        >
      </template>
    </el-dialog>

    <!-- 新增用户弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="新增用户"
      width="450px"
      align-center
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
        style="padding-right: 20px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联工作室" prop="studioId">
          <el-select
            v-model="createForm.studioId"
            style="width: 100%"
            placeholder="请选择(可选)"
            clearable
          >
            <el-option
              v-for="item in studioList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <div
            style="
              font-size: 12px;
              color: #999;
              margin-top: 5px;
              line-height: 1.2;
            "
          >
            若不绑定工作室，该管理员将拥有<b>超级管理员</b>权限。
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 0;
}

.page-card {
  border: none;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-profile .nickname {
  font-size: 14px;
}
</style>
