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
  Top,
  Upload,
} from "@element-plus/icons-vue";
import {
  createAdminStudioBanner,
  deleteAdminStudioBanner,
  getAdminStudioBanners,
  reorderAdminStudioBanners,
  setAdminStudioBannerEnableStatus,
  updateAdminStudioBanner,
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
  dialogMode.value === "create" ? "新增轮播图" : "编辑轮播图"
);

const formRef = ref(null);
const form = reactive({
  imageUrl: "",
  linkUrl: "",
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
  imageUrl: [{ required: true, message: "请先上传图片", trigger: "change" }],
  linkUrl: [{ required: true, message: "请填写跳转链接", trigger: "blur" }],
};

function resetForm() {
  form.imageUrl = "";
  form.linkUrl = "";
  form.sortNo = 0;
  form.enableStatus = 1;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getAdminStudioBanners();
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
  form.imageUrl = row.imageUrl || "";
  form.linkUrl = row.linkUrl || "";
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
      if (dialogMode.value === "create") {
        await createAdminStudioBanner({
          imageUrl: form.imageUrl,
          linkUrl: form.linkUrl,
          sortNo: form.sortNo,
          enableStatus: form.enableStatus,
        });
        ElMessage.success("已新增");
      } else {
        await updateAdminStudioBanner(editingId.value, {
          imageUrl: form.imageUrl,
          linkUrl: form.linkUrl,
          sortNo: form.sortNo,
          enableStatus: form.enableStatus,
        });
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
  await setAdminStudioBannerEnableStatus(row.id, val ? 1 : 0);
  ElMessage.success("已更新启用状态");
  await fetchList();
}

async function removeRow(row) {
  await ElMessageBox.confirm("确认删除该轮播图？", "提示", { type: "warning" });
  await deleteAdminStudioBanner(row.id);
  ElMessage.success("已删除");
  await fetchList();
}

async function moveUp(row) {
  const idx = list.value.findIndex((x) => x.id === row.id);
  if (idx <= 0) return;

  const next = [...list.value];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];

  await reorderAdminStudioBanners(next.map((x) => x.id));
  ElMessage.success("已调整排序");
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

    form.imageUrl = url;
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
          <div class="page-title">首页轮播图</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate"
              >新增轮播图</el-button
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

      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片" width="140">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width: 96px; height: 54px; border-radius: 6px"
              preview-teleported
              :preview-src-list="[row.imageUrl]"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="linkUrl"
          label="跳转链接"
          min-width="260"
          show-overflow-tooltip
        />
        <el-table-column prop="sortNo" label="排序" width="100" />
        <el-table-column prop="enableStatus" label="启用" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enableStatus === 1"
              @change="(val) => toggleEnable(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain :icon="Edit" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button size="small" plain :icon="Top" @click="moveUp(row)"
              >上移</el-button
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

      <el-divider />
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      destroy-on-close
      align-center
      top="5vh"
    >
      <div style="max-height: 70vh; overflow-y: auto; padding-right: 10px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="图片" prop="imageUrl">
            <div class="image-uploader">
              <el-upload
                :http-request="customUpload"
                :show-file-list="false"
                accept="image/*"
              >
                <el-button type="primary" plain :icon="Upload"
                  >上传图片</el-button
                >
              </el-upload>
              <el-progress
                v-if="progressVisible"
                :percentage="progress"
                style="max-width: 260px"
              />
              <div v-if="form.imageUrl" class="image-preview">
                <el-image
                  :src="form.imageUrl"
                  fit="cover"
                  style="width: 180px; height: 100px; border-radius: 8px"
                  preview-teleported
                  :preview-src-list="[form.imageUrl]"
                />
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  @click="form.imageUrl = ''"
                  >移除</el-button
                >
              </div>
            </div>
          </el-form-item>
          <el-form-item label="跳转链接" prop="linkUrl">
            <el-input v-model="form.linkUrl" placeholder="https://..." />
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
.hint {
  display: flex;
  justify-content: flex-end;
}
.image-uploader {
  display: grid;
  gap: 10px;
}
.image-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
