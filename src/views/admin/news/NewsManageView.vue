<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Check,
  Close,
  Delete,
  Edit,
  Plus,
  Promotion,
  Refresh,
  Search,
  Upload,
} from "@element-plus/icons-vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import {
  createAdminStudioNews,
  deleteAdminStudioNews,
  getAdminStudioNewsPage,
  setAdminStudioNewsEnableStatus,
  setAdminStudioNewsPublishStatus,
  updateAdminStudioNews,
  uploadAdminImage,
  getAdminStudios,
} from "@/api/admin";
import { getResourceHtml, getResourceUrl } from "@/utils/baseUrl";

const loading = ref(false);
const saving = ref(false);

const total = ref(0);
const records = ref([]);
const studioList = ref([]);
const studioMap = ref({});

const page = ref(1);
const size = ref(10);
const filters = reactive({ keyword: "", tags: "" });

const progressVisible = ref(false);
const progress = ref(0);

// Editor
const editorRef = shallowRef();
const mode = "default";
const toolbarConfig = {
  excludeKeys: ["group-video"],
};
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const res = await uploadAdminImage(file);
          const url = res.data?.data?.url;
          if (url) {
            insertFn(getResourceUrl(url), "image", url);
          } else {
            ElMessage.error("图片上传失败");
          }
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
  if (editor == null) return;
  editor.destroy();
});

const dialogVisible = ref(false);
const dialogMode = ref("create");
const editingId = ref(null);

const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "发布动态" : "编辑动态"
);

const formRef = ref(null);
const form = reactive({
  title: "",
  author: "",
  tags: [],
  time: [],
  location: "",
  coverUrl: "",
  contentHtml: "",
  enableStatus: 1,
  studioId: null,
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
  title: [{ required: true, message: "请填写标题", trigger: "blur" }],
  contentHtml: [{ required: true, message: "请填写内容", trigger: "blur" }],
  studioId: [
    { required: true, message: "请选择所属工作室", trigger: "change" },
  ],
};

function resetForm() {
  form.title = "";
  form.author = "";
  form.tags = [];
  form.time = [];
  form.location = "";
  form.coverUrl = "";
  form.contentHtml = "";
  form.enableStatus = 1;
  form.studioId = null;
}

async function fetchPage() {
  loading.value = true;

  // 获取工作室列表以供选择
  try {
    const sRes = await getAdminStudios();
    const list = sRes.data?.data || [];
    studioList.value = list;
    studioMap.value = {};
    list.forEach((s) => (studioMap.value[s.id] = s.name));
  } catch (e) {
    console.error(e);
  }

  try {
    const res = await getAdminStudioNewsPage({
      page: page.value,
      size: size.value,
      keyword: filters.keyword,
      tags: filters.tags,
    });
    const data = res.data?.data || {};
    total.value = data.total || 0;
    records.value = Array.isArray(data.records) ? data.records : [];
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
  form.title = row.title || "";
  form.author = row.author || "";
  form.tags = row.tags ? row.tags.split(",").filter(Boolean) : [];
  form.time = [row.startTime, row.endTime].filter(Boolean);
  form.location = row.location || "";
  form.coverUrl = row.coverUrl || "";
  form.contentHtml = getResourceHtml(row.contentHtml || "");
  form.enableStatus = row.enableStatus ?? 1;
  form.studioId = row.studioId || null;
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        title: form.title,
        author: form.author,
        tags: Array.isArray(form.tags) ? form.tags.join(",") : "",
        startTime: form.time?.[0] || null,
        endTime: form.time?.[1] || null,
        location: form.location,
        coverUrl: form.coverUrl,
        contentHtml: form.contentHtml,
        publishStatus: 0,
        enableStatus: form.enableStatus,
        studioId: form.studioId,
      };

      if (dialogMode.value === "create") {
        if (!payload.studioId && studioList.value.length > 0) {
          // 如果是超级管理员(能看到多个工作室)，建议提示选择
          // 但如果用户只绑定了一个，后端会自动处理，这里可选
        }
        // 注意：createAdminStudioNews 第二个参数是 query 里的 studioId
        await createAdminStudioNews(payload, form.studioId);
        ElMessage.success("已创建");
      } else {
        await updateAdminStudioNews(editingId.value, {
          ...payload,
          publishStatus: 1,
        });
        ElMessage.success("已保存");
      }
      dialogVisible.value = false;
      await fetchPage();
    } finally {
      saving.value = false;
    }
  });
}

async function togglePublish(row) {
  await setAdminStudioNewsPublishStatus(
    row.id,
    row.publishStatus === 1 ? 0 : 1
  );
  ElMessage.success("已更新发布状态");
  await fetchPage();
}

async function toggleEnable(row, val) {
  await setAdminStudioNewsEnableStatus(row.id, val ? 1 : 0);
  ElMessage.success("已更新启用状态");
  await fetchPage();
}

async function removeRow(row) {
  await ElMessageBox.confirm("确认删除该动态？", "提示", { type: "warning" });
  await deleteAdminStudioNews(row.id);
  ElMessage.success("已删除");
  await fetchPage();
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

onMounted(fetchPage);
</script>

<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div class="page-title">工作动态 / 活动</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate"
              >发布新动态</el-button
            >
            <el-button
              plain
              :icon="Refresh"
              :loading="loading"
              :disabled="loading"
              @click="fetchPage"
              >刷新</el-button
            >
          </div>
        </div>
      </template>

      <div class="toolbar">
        <el-input
          v-model="filters.keyword"
          placeholder="关键词"
          clearable
          style="max-width: 260px"
        />
        <el-input
          v-model="filters.tags"
          placeholder="标签(逗号分隔)"
          clearable
          style="max-width: 260px"
        />
        <el-button type="primary" plain :icon="Search" @click="fetchPage"
          >查询</el-button
        >
      </div>

      <el-table v-loading="loading" :data="records" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column
          prop="title"
          label="标题"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column
          prop="author"
          label="作者"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="studioName"
          label="所属工作室"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.studioName || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="tags"
          label="标签"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-for="(tag, idx) in row.tags ? row.tags.split(',') : []"
              :key="idx"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="viewCount"
          label="浏览"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <span style="color: #909399">{{ row.viewCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="likeCount"
          label="点赞"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <span style="color: #909399">{{ row.likeCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="publishStatus" label="发布" width="110">
          <template #default="{ row }">
            <el-tag :type="row.publishStatus === 1 ? 'success' : 'info'">
              {{ row.publishStatus === 1 ? "已发布" : "未发布" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enableStatus" label="启用" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enableStatus === 1"
              @change="(val) => toggleEnable(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain :icon="Edit" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="success"
              plain
              :icon="Promotion"
              @click="togglePublish(row)"
            >
              {{ row.publishStatus === 1 ? "撤销发布" : "发布" }}
            </el-button>
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

      <template #footer>
        <div class="pager">
          <el-pagination
            background
            layout="total, prev, pager, next, sizes"
            :total="total"
            :current-page="page"
            :page-size="size"
            :page-sizes="[10, 20, 50]"
            @update:current-page="(p) => (page = p)"
            @update:page-size="(s) => (size = s)"
            @change="fetchPage"
          />
        </div>
      </template>
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="820px"
      destroy-on-close
      align-center
      top="5vh"
    >
      <div style="max-height: 70vh; overflow-y: auto; padding-right: 10px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="作者" prop="author">
            <el-input v-model="form.author" />
          </el-form-item>
          <el-form-item label="标签" prop="tags">
            <el-input-tag
              v-model="form.tags"
              placeholder="输入标签，按回车确认"
            />
          </el-form-item>
          <el-form-item label="时间" prop="time">
            <el-date-picker
              v-model="form.time"
              type="datetimerange"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="地点" prop="location">
            <el-input v-model="form.location" />
          </el-form-item>
          <el-form-item label="封面URL" prop="coverUrl">
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
                  :src="getResourceUrl(form.coverUrl)"
                  fit="cover"
                  style="width: 180px; height: 100px; border-radius: 8px"
                  preview-teleported
                  :preview-src-list="[getResourceUrl(form.coverUrl)]"
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
          <el-form-item label="正文" prop="contentHtml">
            <div style="border: 1px solid #ccc; width: 100%">
              <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :default-config="toolbarConfig"
                :mode="mode"
              />
              <Editor
                v-model="form.contentHtml"
                style="height: 500px; overflow-y: hidden"
                :default-config="editorConfig"
                :mode="mode"
                @on-created="handleCreated"
              />
            </div>
          </el-form-item>
          <el-form-item label="启用" prop="enableStatus">
            <el-switch v-model="enableSwitch" />
          </el-form-item>
          <el-form-item label="所属工作室" prop="studioId">
            <el-select
              v-model="form.studioId"
              placeholder="请选择"
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
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
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
