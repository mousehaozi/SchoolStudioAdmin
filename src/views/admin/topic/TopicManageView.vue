<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Check,
  Close,
  Delete,
  Edit,
  Plus,
  Refresh,
  Sort,
  Upload,
} from "@element-plus/icons-vue";
import {
  createAdminIeTopic,
  deleteAdminIeTopic,
  getAdminIeTopics,
  reorderAdminIeTopic,
  setAdminIeTopicEnableStatus,
  updateAdminIeTopic,
  uploadAdminImage,
} from "@/api/admin";

const loading = ref(false);
const saving = ref(false);
const list = ref([]);

const progressVisible = ref(false);
const progress = ref(0);

const dialogVisible = ref(false);
const dialogMode = ref("create");
const editingId = ref(null);

const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "新增主题" : "编辑主题"
);

const formRef = ref(null);
const form = reactive({
  name: "",
  description: "",
  coverUrl: "",
  sortNo: 0,
  enableStatus: 1,
});

const enableSwitch = computed({
  get() {
    return form.enableStatus === 1;
  },
  set(v) {
    form.enableStatus = v ? 1 : 0;
  },
});

const rules = {
  name: [{ required: true, message: "请填写名称", trigger: "blur" }],
  description: [{ required: true, message: "请填写介绍", trigger: "blur" }],
  coverUrl: [{ required: true, message: "请上传封面", trigger: "change" }],
};

function resetForm() {
  form.name = "";
  form.description = "";
  form.coverUrl = "";
  form.sortNo = 0;
  form.enableStatus = 1;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getAdminIeTopics();
    list.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  dialogMode.value = "create";
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  dialogMode.value = "edit";
  editingId.value = row.id;
  form.name = row.name || "";
  form.description = row.description || "";
  form.coverUrl = row.coverUrl || "";
  form.sortNo = row.sortNo ?? 0;
  form.enableStatus = row.enableStatus ?? 1;
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        name: form.name,
        description: form.description,
        coverUrl: form.coverUrl,
        sortNo: form.sortNo,
        enableStatus: form.enableStatus,
      };
      if (dialogMode.value === "create") {
        await createAdminIeTopic(payload);
        ElMessage.success("已新增");
      } else {
        await updateAdminIeTopic(editingId.value, payload);
        ElMessage.success("已保存");
      }
      dialogVisible.value = false;
      await fetchList();
    } finally {
      saving.value = false;
    }
  });
}

async function toggleEnable(row, val) {
  await setAdminIeTopicEnableStatus(row.id, val ? 1 : 0);
  ElMessage.success("已更新启用状态");
  await fetchList();
}

async function setSort(row) {
  const { value } = await ElMessageBox.prompt(
    "输入新的排序号(sortNo)",
    "排序",
    {
      inputValue: String(row.sortNo ?? 0),
      inputPattern: /^\d+$/,
      inputErrorMessage: "请输入非负整数",
    }
  );
  await reorderAdminIeTopic(row.id, Number(value));
  ElMessage.success("已更新排序");
  await fetchList();
}

async function removeRow(row) {
  await ElMessageBox.confirm("确认删除该主题？", "提示", { type: "warning" });
  await deleteAdminIeTopic(row.id);
  ElMessage.success("已删除");
  await fetchList();
}

async function customUpload(options) {
  const file = options.file;
  progressVisible.value = true;
  progress.value = 0;

  try {
    const res = await uploadAdminImage(file, (p) => {
      progress.value = p;
    });

    const url = res.data?.data?.url;
    if (!url) {
      ElMessage.error("上传失败：未返回url");
      options.onError(new Error("missing url"));
      return;
    }

    form.coverUrl = url;
    ElMessage.success("上传成功");
    options.onSuccess(res);
  } catch (e) {
    options.onError(e);
  } finally {
    progressVisible.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div class="page-title">产教融合主题</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate"
              >新增主题</el-button
            >
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              :disabled="loading"
              @click="fetchList"
              >刷新</el-button
            >
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column
          prop="name"
          label="名称"
          min-width="220"
          show-overflow-tooltip
          align="center"
        />
        <el-table-column
          prop="description"
          label="介绍"
          min-width="260"
          show-overflow-tooltip
          align="center"
        />
        <el-table-column label="封面" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              fit="cover"
              style="width: 72px; height: 40px; border-radius: 8px"
              preview-teleported
              :preview-src-list="[row.coverUrl]"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="sortNo"
          label="排序"
          width="110"
          align="center"
        />
        <el-table-column
          prop="enableStatus"
          label="启用"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              :model-value="row.enableStatus === 1"
              @change="(val) => toggleEnable(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" plain :icon="Edit" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button size="small" plain :icon="Sort" @click="setSort(row)"
              >排序</el-button
            >
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="removeRow(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      destroy-on-close
      align-center
      top="5vh"
    >
      <div style="max-height: 70vh; overflow-y: auto; padding-right: 10px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="介绍" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="科普/劳模/工匠精神..."
            />
          </el-form-item>
          <el-form-item label="封面" prop="coverUrl">
            <div class="cover-uploader">
              <el-upload
                :http-request="customUpload"
                :show-file-list="false"
                accept="image/*"
              >
                <el-button type="primary" plain :icon="Upload"
                  >上传封面</el-button
                >
              </el-upload>
              <el-progress
                v-if="progressVisible"
                :percentage="progress"
                style="max-width: 260px"
              />
              <div v-if="form.coverUrl" class="cover-preview">
                <el-image
                  :src="form.coverUrl"
                  fit="cover"
                  style="width: 180px; height: 100px; border-radius: 8px"
                  preview-teleported
                  :preview-src-list="[form.coverUrl]"
                />
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  @click="form.coverUrl = ''"
                  >移除</el-button
                >
              </div>
            </div>
          </el-form-item>
          <el-form-item label="排序" prop="sortNo">
            <el-input-number v-model="form.sortNo" :min="0" :step="1" />
          </el-form-item>
          <el-form-item label="启用" prop="enableStatus">
            <el-switch v-model="enableSwitch" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button plain :icon="Close" @click="dialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          plain
          :icon="Check"
          :loading="saving"
          @click="submit"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.page-title {
  font-weight: 700;
}
.page-actions {
  display: inline-flex;
  gap: 8px;
}
.cover-uploader {
  display: grid;
  gap: 10px;
}
.cover-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
