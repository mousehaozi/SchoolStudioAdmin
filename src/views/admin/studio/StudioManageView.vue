<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div class="page-title">工作室管理</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate"
              >新增工作室</el-button
            >
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              @click="fetchData"
              >刷新</el-button
            >
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="records" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.iconUrl" shape="square">
              <el-icon>
                <Picture />
              </el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column label="排序" width="140" align="center">
          <template #default="{ row }">
            <el-input
              v-model="row.sortOrder"
              size="small"
              placeholder="排序"
              inputmode="numeric"
              :disabled="sortSavingMap[row.id]"
              @blur="handleSortOrderBlur(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="studioLevel" label="类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.studioLevel === 0 ? 'warning' : 'success'"
              size="small"
            >
              {{ row.studioLevel === 0 ? "国家级" : "省市级" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="simpleIntro"
          label="简介"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column prop="enableStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.enableStatus === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.enableStatus === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button size="small" plain :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Edit" @click="openEdit(row)">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item
                    :icon="row.enableStatus === 1 ? VideoPause : VideoPlay"
                    @click="handleToggleStatus(row)"
                  >
                    {{ row.enableStatus === 1 ? "停用" : "启用" }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    :icon="Delete"
                    @click="handleDelete(row)"
                    style="color: #f56c6c"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </CommonCard>

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑工作室' : '新增工作室'"
      width="500px"
      align-center
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="padding-right: 20px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入工作室名称" />
        </el-form-item>
        <el-form-item label="图标 URL" prop="iconUrl">
          <div class="upload-container">
            <el-input
              v-model="form.iconUrl"
              placeholder="请输入图片 URL 或上传"
            >
              <template #append>
                <el-upload
                  :http-request="handleUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-button plain :icon="Upload">上传</el-button>
                </el-upload>
              </template>
            </el-input>
            <div class="icon-preview" v-if="form.iconUrl">
              <img :src="form.iconUrl" alt="Preview" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="简介" prop="simpleIntro">
          <el-input
            v-model="form.simpleIntro"
            type="textarea"
            :rows="3"
            placeholder="请输入简介"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input
            v-model="form.sortOrder"
            placeholder="请输入排序值"
            inputmode="numeric"
          />
        </el-form-item>
        <el-form-item label="类型" prop="studioLevel">
          <el-radio-group v-model="form.studioLevel">
            <el-radio :label="0">国家级</el-radio>
            <el-radio :label="1">省市级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="enableStatus">
          <el-radio-group v-model="form.enableStatus">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button plain @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" plain :loading="saving" @click="submitForm"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Refresh,
  Edit,
  Delete,
  MoreFilled,
  VideoPause,
  VideoPlay,
  Picture,
  Upload,
} from "@element-plus/icons-vue";
import {
  getAdminStudios,
  createAdminStudio,
  updateAdminStudio,
  deleteAdminStudio,
  toggleAdminStudioStatus,
  uploadAdminImage,
} from "@/api/admin";
import { formatDate } from "@/utils/format";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const records = ref([]);
const sortSavingMap = reactive({});

function normalizeStudioRecord(item) {
  const normalizedSortOrder = String(item.sortOrder ?? 0);
  return {
    ...item,
    sortOrder: normalizedSortOrder,
    _originalSortOrder: normalizedSortOrder,
  };
}

// 列表获取
async function fetchData() {
  loading.value = true;
  try {
    const res = await getAdminStudios();
    // 根据 spec，返回的是对象，但通常 list 接口会返回数组或包含数组的对象
    // 如果 spec 中 example 是 timestamp, status 等，可能是错误示例或者结构不完整
    // 我们假设它返回 data: [] 或者直接是数组
    records.value = (res.data?.data || []).map(normalizeStudioRecord);
  } catch (error) {
    console.error("获取工作室列表失败", error);
  } finally {
    loading.value = false;
  }
}

// 弹窗表单
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const currentId = ref(null);

const form = reactive({
  name: "",
  iconUrl: "",
  simpleIntro: "",
  sortOrder: "0",
  studioLevel: 1, // 默认省部级
  enableStatus: 1,
});

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  iconUrl: [{ required: true, message: "请输入图标 URL", trigger: "blur" }],
  simpleIntro: [{ required: true, message: "请输入简介", trigger: "blur" }],
  sortOrder: [
    { required: true, message: "请输入排序值", trigger: "blur" },
    { pattern: /^\d+$/, message: "排序值只能为数字", trigger: "blur" },
  ],
};

function openCreate() {
  isEdit.value = false;
  currentId.value = null;
  form.name = "";
  form.iconUrl = "";
  form.simpleIntro = "";
  form.sortOrder = "0";
  form.studioLevel = 1;
  form.enableStatus = 1;
  dialogVisible.value = true;
}

function openEdit(row) {
  isEdit.value = true;
  currentId.value = row.id;
  form.name = row.name;
  form.iconUrl = row.iconUrl;
  form.simpleIntro = row.simpleIntro;
  form.sortOrder = String(row.sortOrder ?? 0);
  form.studioLevel = row.studioLevel ?? 1;
  form.enableStatus = row.enableStatus;
  dialogVisible.value = true;
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        if (isEdit.value) {
          await updateAdminStudio(currentId.value, { ...form });
          ElMessage.success("更新成功");
        } else {
          await createAdminStudio({ ...form });
          ElMessage.success("创建成功");
        }
        dialogVisible.value = false;
        fetchData();
      } catch (error) {
        console.error("提交失败", error);
      } finally {
        saving.value = false;
      }
    }
  });
}

async function handleSortOrderBlur(row) {
  const nextValue = String(row.sortOrder ?? "").trim();

  if (!/^\d+$/.test(nextValue)) {
    ElMessage.error("排序值只能为数字");
    row.sortOrder = String(row.sortOrder ?? 0).replace(/\D/g, "") || "0";
    await fetchData();
    return;
  }

  if (
    sortSavingMap[row.id] ||
    nextValue === String(row._originalSortOrder ?? row.sortOrder)
  ) {
    row.sortOrder = nextValue;
    return;
  }

  sortSavingMap[row.id] = true;
  try {
    await updateAdminStudio(row.id, {
      name: row.name,
      iconUrl: row.iconUrl,
      simpleIntro: row.simpleIntro,
      sortOrder: nextValue,
      studioLevel: row.studioLevel,
      enableStatus: row.enableStatus,
    });
    row.sortOrder = nextValue;
    row._originalSortOrder = nextValue;
    await fetchData();
    ElMessage.success("排序已更新");
  } catch (error) {
    console.error("更新排序失败", error);
    ElMessage.error("更新排序失败");
    await fetchData();
  } finally {
    sortSavingMap[row.id] = false;
  }
}

// 状态切换
async function handleToggleStatus(row) {
  const newStatus = row.enableStatus === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? "启用" : "停用";
  try {
    await ElMessageBox.confirm(
      `确认${actionText}工作室 "${row.name}"?`,
      "提示",
      {
        type: "warning",
      },
    );
    await toggleAdminStudioStatus(row.id, newStatus);
    ElMessage.success(`${actionText}成功`);
    fetchData();
  } catch (error) {
    if (error !== "cancel") console.error(error);
  }
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除工作室 "${row.name}"? 此操作不可恢复！`,
      "危险操作",
      {
        type: "error",
        confirmButtonText: "确定删除",
        confirmButtonClass: "el-button--danger",
      },
    );
    await deleteAdminStudio(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") console.error(error);
  }
}

// 上传相关
async function handleUpload(options) {
  const { file } = options;
  try {
    const res = await uploadAdminImage(file);
    const url = res.data?.data?.url;
    if (url) {
      form.iconUrl = url;
      ElMessage.success("上传成功");
    } else {
      ElMessage.error(res.data?.message || "上传失败");
    }
  } catch (error) {
    console.error("上传出错", error);
    ElMessage.error("上传出错");
  }
}

// 时间格式化
function formatTime(time) {
  return time ? formatDate(time) : "-";
}

onMounted(() => {
  fetchData();
});
</script>

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

.upload-container {
  width: 100%;
}

.icon-preview {
  margin-top: 10px;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
