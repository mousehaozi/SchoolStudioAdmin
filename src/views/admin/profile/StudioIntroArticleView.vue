<script setup>
import {
  ref,
  reactive,
  onMounted,
  computed,
  shallowRef,
  onBeforeUnmount,
} from "vue";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Refresh,
  Edit,
  Delete,
  Upload,
  Close,
  Check,
} from "@element-plus/icons-vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import {
  getAdminStudioIntroArticleList,
  createAdminStudioIntroArticle,
  updateAdminStudioIntroArticle,
  deleteAdminStudioIntroArticle,
  setAdminStudioIntroArticleEnableStatus,
  uploadAdminImage,
  getAdminStudios,
} from "@/api/admin";

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const records = ref([]);
const studioList = ref([]);

// Filters
const filters = reactive({
  studioId: null,
});

// Editor
const editorRef = shallowRef();
const mode = "default";
const toolbarConfig = { excludeKeys: ["group-video"] };
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const res = await uploadAdminImage(file);
          const url = res.data?.data?.url;
          if (url) insertFn(url, "image", url);
          else ElMessage.error("图片上传失败");
        } catch (e) {
          console.error(e);
          ElMessage.error("图片上传出错");
        }
      },
    },
  },
};
const handleCreated = (editor) => {
  editorRef.value = editor;
};
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) editor.destroy();
});

// Upload
const progressVisible = ref(false);
const progress = ref(0);
async function customUpload(options) {
  const file = options.file;
  progressVisible.value = true;
  progress.value = 0;
  try {
    const res = await uploadAdminImage(file, (p) => {
      progress.value = p;
    });
    const url = res.data?.data?.url;
    if (url) {
      form.coverUrl = url;
      ElMessage.success("上传成功");
    } else {
      ElMessage.error("失败:无URL");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("上传出错");
  } finally {
    progressVisible.value = false;
  }
}

// Dialog
const dialogVisible = ref(false);
const dialogMode = ref("create");
const editingId = ref(null);
const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "新增图文" : "编辑图文"
);

const formRef = ref(null);
const form = reactive({
  title: "",
  coverUrl: "",
  summary: "",
  contentHtml: "",
  sortNo: 1,
  enableStatus: 1,
  studioId: null,
});
const enableSwitch = computed({
  get: () => form.enableStatus === 1,
  set: (val) => (form.enableStatus = val ? 1 : 0),
});

const rules = {
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  contentHtml: [{ required: true, message: "请输入内容", trigger: "blur" }],
  studioId: [{ required: true, message: "请选择工作室", trigger: "change" }],
};

function resetForm() {
  form.title = "";
  form.coverUrl = "";
  form.summary = "";
  form.contentHtml = "";
  form.sortNo = 1;
  form.enableStatus = 1;
  form.studioId = null;
}

// Actions
async function fetchList() {
  loading.value = true;
  try {
    if (!userStore.studioId && studioList.value.length === 0) {
      const sRes = await getAdminStudios();
      studioList.value = sRes.data?.data || [];
    }
    const params = {};
    if (filters.studioId) params.studioId = filters.studioId;

    const res = await getAdminStudioIntroArticleList(params);
    records.value = res.data?.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  dialogMode.value = "create";
  editingId.value = null;
  resetForm();
  // If user is admin (unbound) and selected a filter, pre-fill
  if (!userStore.studioId && filters.studioId) {
    form.studioId = filters.studioId;
  }
  dialogVisible.value = true;
}

function openEdit(row) {
  dialogMode.value = "edit";
  editingId.value = row.id;

  form.title = row.title;
  form.coverUrl = row.coverUrl;
  form.summary = row.summary;
  form.contentHtml = row.contentHtml;
  form.sortNo = row.sortNo;
  form.enableStatus = row.enableStatus;
  form.studioId = row.studioId; // mainly for display if useful? API update doesn't usually change studioId

  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    // For admin users (no studioId joined), StudioId is required on Create
    if (
      !userStore.studioId &&
      dialogMode.value === "create" &&
      !form.studioId
    ) {
      ElMessage.warning("请选择工作室");
      return;
    }

    saving.value = true;
    try {
      let cleanContentHtml = form.contentHtml;
      cleanContentHtml = cleanContentHtml.replace(
        /<p([^>]*)style="([^"]*)"([^>]*)>(\s*<img[^>]+>\s*)<\/p>/gi,
        (match, p1, style, p3, imgContent) => {
          let newStyle = style
            .replace(/text-indent:\s*[^;]+;?/gi, "")
            .replace(/text-align:\s*justify;?/gi, "")
            .trim();
          let styleAttr = newStyle ? ` style="${newStyle}"` : "";
          return `<p${p1}${styleAttr}${p3}>${imgContent}</p>`;
        }
      );
      cleanContentHtml = cleanContentHtml.replace(
        /(<img[^>]*)style="([^"]*)"([^>]*>)/gi,
        (match, p1, style, p3) => {
          let newStyle = style
            .replace(/text-indent:\s*[^;]+;?/gi, "")
            .replace(/text-align:\s*justify;?/gi, "")
            .trim();
          let styleAttr = newStyle ? ` style="${newStyle}"` : "";
          return `${p1}${styleAttr}${p3}`;
        }
      );

      const payload = {
        title: form.title,
        coverUrl: form.coverUrl,
        summary: form.summary,
        contentHtml: cleanContentHtml,
        sortNo: form.sortNo,
        enableStatus: form.enableStatus,
      };

      if (dialogMode.value === "create") {
        await createAdminStudioIntroArticle(
          payload,
          userStore.studioId || form.studioId
        );
        ElMessage.success("新增成功");
      } else {
        await updateAdminStudioIntroArticle(editingId.value, payload);
        ElMessage.success("更新成功");
      }
      dialogVisible.value = false;
      await fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      saving.value = false;
    }
  });
}

async function toggleEnable(row, val) {
  try {
    await setAdminStudioIntroArticleEnableStatus(row.id, val ? 1 : 0);
    row.enableStatus = val ? 1 : 0;
    ElMessage.success("状态已更新");
  } catch {
    // revert visual
    // row.enableStatus = !val ? 1 : 0;
    // better to refresh
    await fetchList();
  }
}

async function removeRow(row) {
  try {
    await ElMessageBox.confirm("确认删除该图文?", "警告", { type: "warning" });
    await deleteAdminStudioIntroArticle(row.id);
    ElMessage.success("已删除");
    await fetchList();
  } catch {
    // cancel
  }
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="page">
    <CommonCard
      shadow="never"
      class="page-card"
      body-style="display: flex; flex-direction: column; overflow: hidden; padding: 20px;"
    >
      <template #header>
        <div class="page-header">
          <div class="page-title">工作室简介图文</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate">
              新增图文
            </el-button>
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              @click="fetchList"
            >
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- Filter for Super Admin: Select Studio -->
      <div v-if="!userStore.studioId" class="toolbar">
        <el-select
          v-model="filters.studioId"
          placeholder="筛选工作室"
          clearable
          style="width: 240px"
          @change="fetchList"
        >
          <el-option
            v-for="item in studioList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        style="width: 100%"
        height="100%"
        row-key="id"
      >
        <el-table-column prop="sortNo" label="排序" width="80" align="center" />
        <el-table-column
          prop="title"
          label="标题"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              style="width: 60px; height: 40px; border-radius: 4px"
              fit="cover"
              preview-teleported
              :preview-src-list="[row.coverUrl]"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="summary"
          label="简介"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column prop="enableStatus" label="启用" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enableStatus === 1"
              @change="(val) => toggleEnable(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain :icon="Edit" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="removeRow(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </CommonCard>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="820px"
      destroy-on-close
      align-center
      top="5vh"
    >
      <div style="max-height: 70vh; overflow-y: auto; padding-right: 10px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-form-item
            v-if="!userStore.studioId && dialogMode === 'create'"
            label="所属工作室"
            prop="studioId"
          >
            <el-select
              v-model="form.studioId"
              placeholder="请选择工作室"
              style="width: 100%"
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

          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入标题" />
          </el-form-item>

          <el-form-item label="排序" prop="sortNo">
            <el-input-number v-model="form.sortNo" :min="1" />
          </el-form-item>

          <el-form-item label="简介" prop="summary">
            <el-input
              v-model="form.summary"
              type="textarea"
              :rows="3"
              placeholder="简短介绍..."
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
                  >上传图片</el-button
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
                />
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  @click="form.coverUrl = ''"
                >
                  移除
                </el-button>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="详细内容" prop="contentHtml">
            <div style="border: 1px solid #ccc; width: 100%">
              <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :default-config="toolbarConfig"
                :mode="mode"
              />
              <Editor
                v-model="form.contentHtml"
                style="height: 400px; overflow-y: hidden"
                :default-config="editorConfig"
                :mode="mode"
                @on-created="handleCreated"
              />
            </div>
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
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-weight: 700;
  font-size: 16px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.toolbar {
  margin-bottom: 12px;
}

.cover-uploader {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-preview {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
</style>
