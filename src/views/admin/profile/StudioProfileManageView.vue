<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import { nextTick } from "vue";
import {
  Check,
  Close,
  Edit,
  Refresh,
  Upload,
  User,
  Phone,
  CollectionTag,
  School,
  Link,
} from "@element-plus/icons-vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import {
  getAdminStudioProfiles,
  overwriteAdminCurrentStudioProfile,
  uploadAdminImage,
  getAdminStudios,
} from "@/api/admin";
import { formatDateTime } from "@/utils/format";
import { useUserStore } from "@/stores/user";
import { getResourceHtml, getResourceUrl } from "@/utils/baseUrl";

const userStore = useUserStore();

const compressToWebp = (file, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    // 如果已经是 webp 格式，且大小适中（比如不大于 1MB），可以选择不压缩，但为了保证大小，统一处理
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const newFile = new File([blob], fileName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file); // 失败则原样返回
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const loading = ref(false);
const saving = ref(false);
const currentProfile = ref(null);
const profileList = ref([]);
const studioList = ref([]);
const selectedStudioId = ref(null);
const studioMap = ref({});

const dialogVisible = ref(false);
const formRef = ref(null);
const form = reactive({
  title: "",
  coverUrl: "",
  contentHtml: "",
  enableStatus: 1,
  leaderName: "",
  leaderIntro: "",
  orgStructure: [],
  coreFunctions: "",
  contactUs: [],
  studioId: null,
});

// Tag Input for orgStructure
const tagInputVisible = ref(false);
const tagInputValue = ref("");
const tagInputRef = ref(null);

const showTagInput = () => {
  tagInputVisible.value = true;
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

const handleTagInputConfirm = () => {
  if (tagInputValue.value) {
    if (!form.orgStructure.includes(tagInputValue.value)) {
      form.orgStructure.push(tagInputValue.value);
    }
  }
  tagInputVisible.value = false;
  tagInputValue.value = "";
};

const removeOrgTag = (tag) => {
  form.orgStructure = form.orgStructure.filter((t) => t !== tag);
};

// Contact management
const addContact = () => {
  form.contactUs.push({
    name: "",
    phone: "",
    distraction: "",
    wechatUrl: "",
  });
};

const removeContact = (index) => {
  form.contactUs.splice(index, 1);
};

const tryParse = (str) => {
  if (!str) return [];
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Parse error:", e);
    return [];
  }
};

// Cover Upload
const coverProgressVisible = ref(false);
const coverProgress = ref(0);

async function customUploadCover(options) {
  const file = options.file;
  coverProgressVisible.value = true;
  coverProgress.value = 0;
  try {
    const compressedFile = await compressToWebp(file);
    const res = await uploadAdminImage(
      compressedFile,
      (p) => (coverProgress.value = p)
    );
    const url = res.data?.data?.url;
    if (url) {
      form.coverUrl = url;
      ElMessage.success("封面上传成功");
    } else {
      ElMessage.error("上传失败：未返回URL");
    }
  } catch {
    ElMessage.error("上传出错");
  } finally {
    coverProgressVisible.value = false;
  }
}

// Editor
const editorRef = shallowRef();
const mode = "default";
const toolbarConfig = {
  excludeKeys: ["fullScreen"],
};
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        let loadingInstance = ElLoading.service({
          text: "图片处理中...",
          background: "rgba(255, 255, 255, 0.7)",
        });
        try {
          const compressedFile = await compressToWebp(file);
          if (loadingInstance) {
            loadingInstance.setText("图片上传中... 0%");
          }
          const res = await uploadAdminImage(compressedFile, (p) => {
            if (loadingInstance) {
              loadingInstance.setText(`图片上传中... ${p || 0}%`);
            }
          });
          const url = res.data?.data?.url;
          if (url) {
            insertFn(url, "image", url);
            ElMessage.success("图片上传成功");
          } else {
            ElMessage.error("图片上传失败");
          }
        } catch (e) {
          console.error(e);
          ElMessage.error("图片上传出错");
        } finally {
          if (loadingInstance) loadingInstance.close();
        }
      },
    },
    uploadVideo: {
      async customUpload(file, insertFn) {
        let loadingInstance = ElLoading.service({
          text: "视频上传中... 0%",
          background: "rgba(255, 255, 255, 0.7)",
        });
        try {
          const res = await uploadAdminImage(file, (p) => {
            if (loadingInstance) {
              loadingInstance.setText(`视频上传中... ${p || 0}%`);
            }
          });
          const url = res.data?.data?.url;
          if (url) {
            insertFn(url);
            ElMessage.success("视频上传成功");
          } else {
            ElMessage.error("视频上传失败");
          }
        } catch (e) {
          console.error(e);
          ElMessage.error("视频上传出错");
        } finally {
          if (loadingInstance) loadingInstance.close();
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

// Rules
const rules = {
  title: [{ required: true, message: "请填写标题", trigger: "blur" }],
  contentHtml: [{ required: true, message: "请填写内容", trigger: "blur" }],
  leaderName: [
    { required: true, message: "请填写领衔人姓名", trigger: "blur" },
  ],
  leaderIntro: [
    { required: true, message: "请填写领衔人介绍", trigger: "blur" },
  ],
  coreFunctions: [
    { required: true, message: "请填写核心功能", trigger: "blur" },
  ],
};

async function fetchList() {
  loading.value = true;
  try {
    if (userStore.role === "SUPERADMIN") {
      const sRes = await getAdminStudios();
      studioList.value = sRes.data?.data || [];
      studioMap.value = {};
      studioList.value.forEach((s) => {
        studioMap.value[s.id] = s.name;
      });
    } else {
      studioList.value = [];
      studioMap.value = {};
    }

    const res = await getAdminStudioProfiles();
    const data = res.data?.data;
    profileList.value = Array.isArray(data) ? data : [];

    if (userStore.role !== "SUPERADMIN") {
      // 逻辑调整：如果是普通工作室管理员，直接使用返回的第一个简介
      selectedStudioId.value = userStore.studioId;
      currentProfile.value =
        profileList.value.length > 0 ? profileList.value[0] : null;
    } else if (studioList.value.length === 1) {
      // 只有一个时（超级管理员获取到的只有一个工作室），自动选择
      selectedStudioId.value = studioList.value[0].id;
      currentProfile.value =
        profileList.value.find((p) => p.studioId === selectedStudioId.value) ||
        null;
    } else if (studioList.value.length > 1) {
      // 多个时（超级管理员），尝试保持选择或默认选第一个
      if (
        !selectedStudioId.value ||
        !studioList.value.find((s) => s.id === selectedStudioId.value)
      ) {
        selectedStudioId.value = studioList.value[0].id;
        currentProfile.value =
          profileList.value.find(
            (p) => p.studioId === selectedStudioId.value
          ) || null;
      } else {
        currentProfile.value =
          profileList.value.find(
            (p) => p.studioId === selectedStudioId.value
          ) || null;
      }
    } else {
      currentProfile.value = null;
      selectedStudioId.value = null;
    }
  } finally {
    loading.value = false;
  }
}

function handleStudioChange(studioId) {
  currentProfile.value =
    profileList.value.find((p) => p.studioId === studioId) || null;
}

function openOverwrite() {
  if (currentProfile.value) {
    form.title = currentProfile.value.title || "";
    form.coverUrl = currentProfile.value.coverUrl || "";
    form.contentHtml = currentProfile.value.contentHtml || "";
    form.enableStatus = currentProfile.value.enableStatus ?? 1;
    form.leaderName = currentProfile.value.leaderName || "";
    form.leaderIntro = currentProfile.value.leaderIntro || "";
    form.coreFunctions = currentProfile.value.coreFunctions || "";
    form.orgStructure = tryParse(currentProfile.value.orgStructure);
    form.contactUs = tryParse(currentProfile.value.contactUs);
    form.studioId = currentProfile.value.studioId;
  } else {
    form.title = "";
    form.coverUrl = "";
    form.contentHtml = "";
    form.enableStatus = 1;
    form.leaderName = "";
    form.leaderIntro = "";
    form.coreFunctions = "";
    form.orgStructure = [];
    form.contactUs = [];
    form.studioId = selectedStudioId.value;
  }
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!form.studioId) {
      ElMessage.warning("请先选择所属工作室");
      return;
    }
    saving.value = true;
    try {
      const { studioId, ...restForm } = form;

      // 清理富文本内容中图片关联的缩进和两端对齐样式
      let cleanContentHtml = restForm.contentHtml;
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

      await overwriteAdminCurrentStudioProfile(
        {
          id: currentProfile.value?.id,
          ...restForm,
          contentHtml: cleanContentHtml,
          orgStructure: JSON.stringify(form.orgStructure),
          contactUs: JSON.stringify(form.contactUs),
        },
        studioId
      );
      ElMessage.success("已提交");
      dialogVisible.value = false;
      await fetchList();
    } finally {
      saving.value = false;
    }
  });
}

onMounted(fetchList);
</script>

<template>
  <div class="page">
    <CommonCard
      shadow="never"
      class="page-card"
      body-style="overflow-y: auto; height: 100%;"
    >
      <template #header>
        <div class="page-header">
          <div class="page-title">工作室简介</div>
          <div class="page-actions">
            <!-- 工作室选择器 -->
            <el-select
              v-if="studioList.length > 1"
              v-model="selectedStudioId"
              placeholder="请选择工作室"
              style="width: 220px; margin-right: 12px"
              @change="handleStudioChange"
            >
              <el-option
                v-for="item in studioList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>

            <el-button
              type="primary"
              plain
              :icon="Edit"
              :disabled="!selectedStudioId"
              @click="openOverwrite"
              >{{ currentProfile ? "编辑简介" : "添加简介" }}</el-button
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

      <div v-loading="loading" class="profile-preview-area">
        <div v-if="currentProfile" class="profile-detail">
          <div class="profile-header">
            <el-image
              v-if="currentProfile.coverUrl"
              :src="getResourceUrl(currentProfile.coverUrl)"
              fit="contain"
              class="profile-cover"
              :preview-src-list="[getResourceUrl(currentProfile.coverUrl)]"
            />
            <div class="profile-info">
              <div class="profile-title-row">
                <h2>{{ currentProfile.title }}</h2>
              </div>
              <div class="profile-meta">
                <span class="time"
                  >更新时间:
                  {{ formatDateTime(currentProfile.updatedAt) }}</span
                >
              </div>
            </div>
          </div>

          <div class="profile-sections">
            <!-- 核心详情 -->
            <section class="info-section">
              <el-divider content-position="left">简介内容</el-divider>
              <div
                class="profile-content ql-snow"
                v-html="getResourceHtml(currentProfile.contentHtml)"
              ></div>
            </section>

            <!-- 详细资料网格 -->
            <el-row :gutter="24" class="metadata-grid">
              <el-col :span="12">
                <section class="info-section">
                  <el-divider content-position="left">领衔人信息</el-divider>
                  <div class="info-card">
                    <div class="side-item">
                      <div class="side-label">领衔人</div>
                      <div class="side-value">
                        {{ currentProfile.leaderName || "未设置" }}
                      </div>
                    </div>
                    <div class="side-item">
                      <div class="side-label">领衔人介绍</div>
                      <div class="side-value intro-text">
                        {{ currentProfile.leaderIntro || "未设置" }}
                      </div>
                    </div>
                  </div>
                </section>
              </el-col>
              <el-col :span="12">
                <section class="info-section">
                  <el-divider content-position="left">核心功能</el-divider>
                  <div class="info-card tag-group">
                    <el-tag
                      v-for="item in (currentProfile.coreFunctions || '')
                        .split(',')
                        .filter((i) => i)"
                      :key="item"
                      class="m-1"
                    >
                      {{ item }}
                    </el-tag>
                    <span
                      v-if="!currentProfile.coreFunctions"
                      class="empty-text"
                      >未设置</span
                    >
                  </div>
                </section>
                <section class="info-section" style="margin-top: 24px">
                  <el-divider content-position="left">组织架构</el-divider>
                  <div class="info-card tag-group">
                    <el-tag
                      v-for="item in tryParse(currentProfile.orgStructure)"
                      :key="item"
                      type="success"
                      class="m-1"
                    >
                      {{ item }}
                    </el-tag>
                    <span
                      v-if="!tryParse(currentProfile.orgStructure).length"
                      class="empty-text"
                      >未设置</span
                    >
                  </div>
                </section>
              </el-col>
            </el-row>

            <!-- 联系方式 -->
            <section class="info-section">
              <el-divider content-position="left">联系我们</el-divider>
              <div class="contact-grid">
                <div
                  v-for="(contact, index) in tryParse(currentProfile.contactUs)"
                  :key="index"
                  class="contact-card"
                >
                  <div class="contact-role">
                    <el-icon>
                      <CollectionTag />
                    </el-icon>
                    {{ contact.distraction || "-" }}
                  </div>
                  <div class="contact-details">
                    <div class="detail-row">
                      <el-icon>
                        <User />
                      </el-icon>
                      <span class="name">{{ contact.name }}</span>
                    </div>
                    <div class="detail-row">
                      <el-icon>
                        <Phone />
                      </el-icon>
                      <span class="phone">{{ contact.phone }}</span>
                    </div>
                    <div v-if="contact.wechatUrl" class="detail-row">
                      <el-icon>
                        <Link />
                      </el-icon>
                      <span class="wechat-link" title="公众号地址">{{
                        contact.wechatUrl
                      }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="!tryParse(currentProfile.contactUs).length"
                  class="empty-text"
                >
                  未设置
                </div>
              </div>
            </section>
          </div>
        </div>

        <el-empty
          v-else
          :description="
            studioList.length > 0
              ? '请在上方选择工作室以查看详情'
              : '暂无工作室数据'
          "
        >
          <template #image>
            <el-icon
              v-if="studioList.length > 0"
              style="
                font-size: 48px;
                color: var(--el-color-primary);
                opacity: 0.5;
              "
            >
              <School />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      class="profile-edit-dialog"
      title="编辑当前简介"
      width="50%"
      destroy-on-close
      align-center
    >
      <div class="profile-edit-dialog-body">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入页面标题" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="领衔人" prop="leaderName">
                <el-input v-model="form.leaderName" placeholder="领衔人姓名" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="领衔人介绍" prop="leaderIntro">
            <el-input
              v-model="form.leaderIntro"
              type="textarea"
              :rows="3"
              placeholder="领衔人简介"
            />
          </el-form-item>

          <el-form-item label="核心功能" prop="coreFunctions">
            <el-input
              v-model="form.coreFunctions"
              placeholder="输入功能，多个请用英文逗号(,)分隔"
            />
          </el-form-item>

          <el-form-item label="组织架构" prop="orgStructure">
            <div class="tag-input-group">
              <el-tag
                v-for="tag in form.orgStructure"
                :key="tag"
                closable
                class="m-1"
                @close="removeOrgTag(tag)"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="tagInputRef"
                v-model="tagInputValue"
                size="small"
                style="width: 100px"
                @keyup.enter="handleTagInputConfirm"
                @blur="handleTagInputConfirm"
              />
              <el-button v-else size="small" plain @click="showTagInput"
                >+ 添加架构</el-button
              >
            </div>
          </el-form-item>

          <el-form-item label="联系人" prop="contactUs">
            <div class="contact-form-list">
              <div
                v-for="(item, index) in form.contactUs"
                :key="index"
                class="contact-form-item"
              >
                <el-row :gutter="10">
                  <el-col :span="5">
                    <el-input
                      v-model="item.name"
                      placeholder="姓名"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="5">
                    <el-input
                      v-model="item.phone"
                      placeholder="电话"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="5">
                    <el-input
                      v-model="item.distraction"
                      placeholder="职位/说明"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="7">
                    <el-input
                      v-model="item.wechatUrl"
                      placeholder="公众号链接/地址"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="2">
                    <el-button
                      type="danger"
                      :icon="Close"
                      circle
                      plain
                      size="small"
                      @click="removeContact(index)"
                    />
                  </el-col>
                </el-row>
              </div>
              <el-button type="primary" plain size="small" @click="addContact"
                >+ 添加联系人</el-button
              >
            </div>
          </el-form-item>

          <el-form-item label="封面图" prop="coverUrl">
            <div class="cover-uploader">
              <el-upload
                :http-request="customUploadCover"
                :show-file-list="false"
                accept="image/*"
              >
                <el-button type="primary" plain :icon="Upload"
                  >上传图片</el-button
                >
              </el-upload>
              <el-progress
                v-if="coverProgressVisible"
                :percentage="coverProgress"
                style="max-width: 200px"
              />
              <div v-if="form.coverUrl" class="cover-preview">
                <el-image
                  :src="getResourceUrl(form.coverUrl)"
                  fit="cover"
                  style="
                    width: 120px;
                    height: 68px;
                    border-radius: 6px;
                    border: 1px solid #dcdfe6;
                  "
                />
                <el-button text plain type="danger" @click="form.coverUrl = ''"
                  >移除</el-button
                >
              </div>
            </div>
          </el-form-item>
          <el-form-item label="内容简介" prop="contentHtml">
            <div
              class="profile-editor"
              style="
                border: 1px solid #ccc;
                border-radius: 4px;
                position: relative;
                z-index: 99;
              "
            >
              <Toolbar
                class="profile-editor-toolbar"
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :default-config="toolbarConfig"
                :mode="mode"
              />
              <Editor
                v-model="form.contentHtml"
                class="profile-editor-content"
                :default-config="editorConfig"
                :mode="mode"
                @on-created="handleCreated"
              />
            </div>
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
          >提交</el-button
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
  font-size: 18px;
}

.page-actions {
  display: inline-flex;
  gap: 8px;
}

.profile-preview-area {
  height: 100%;
  min-height: 560px;
  padding: 0px;
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow: hidden;
}

:deep(.profile-edit-dialog) {
  height: min(90vh, 920px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.profile-edit-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 0;
}

:deep(.profile-edit-dialog .el-dialog__footer) {
  flex-shrink: 0;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
  background: #ffffff;
}

.profile-edit-dialog-body {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.profile-detail {
  height: 100%;
  width: auto;
  max-width: 100%;
  aspect-ratio: 9 / 16;
  flex: 0 0 auto;
  margin: 0 auto;
  padding: 18px 14px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  border: 1px solid #e5eaf3;
  border-radius: 28px;
  box-shadow: 0 18px 45px rgba(20, 40, 80, 0.12);
}

.profile-header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%);
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #f0f3f8;
}

.profile-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.profile-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  flex-shrink: 0;
  background: #ffffff;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.profile-info h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0;
  line-height: 1.35;
}

.profile-meta {
  color: #909399;
  font-size: 12px;
}

.profile-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  background: #fff;
}

.info-card {
  background: #f8fafc;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #edf2f7;
  height: 100%;
}

.side-item {
  margin-bottom: 20px;
}

.side-item:last-child {
  margin-bottom: 0;
}

.side-label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a0aec0;
  margin-bottom: 6px;
  font-weight: 600;
}

.side-value {
  color: #2d3748;
  font-weight: 600;
  font-size: 14px;
}

.intro-text {
  font-weight: 400;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #4a5568;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.tag-group :deep(.el-tag) {
  max-width: 100%;
  white-space: normal;
  height: auto;
  line-height: 1.4;
  padding: 4px 8px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.contact-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f3f8;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: var(--el-color-primary-light-5);
}

.contact-role {
  background: #f8fafc;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  border-bottom: 1px solid #f0f3f8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #4a5568;
  font-size: 14px;
}

.detail-row .el-icon {
  color: #a0aec0;
  font-size: 16px;
}

.detail-row .name {
  font-weight: 600;
  color: #2d3748;
}

.detail-row .phone {
  color: var(--el-color-primary);
  font-family: inherit;
}

.empty-text {
  color: #c0c4cc;
  font-size: 12px;
  font-style: italic;
}

.profile-content {
  line-height: 1.8;
  color: #444;
  padding: 4px 0;
  word-break: break-word;
}

.metadata-grid {
  row-gap: 20px;
}

.metadata-grid :deep(.el-col) {
  flex: 0 0 100%;
  max-width: 100%;
}

.wechat-link {
  color: #67c23a;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.profile-detail :deep(.el-divider) {
  margin: 14px 0;
}

.profile-detail :deep(.el-divider__text) {
  max-width: calc(100% - 40px);
  font-size: 14px;
  font-weight: 600;
  white-space: normal;
  line-height: 1.4;
}

.profile-content :deep(img),
.profile-content :deep(video),
.profile-content :deep(iframe) {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px 0;
}

/* Ensure editor content itself makes media responsive */
:deep(.w-e-text-container img),
:deep(.w-e-text-container video),
:deep(.w-e-text-container iframe) {
  max-width: 100%;
}

:deep([data-w-e-type="video"]) {
  max-width: 100%;
}

.profile-editor {
  width: 70%;
  aspect-ratio: 9 / 16;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile-editor-toolbar {
  flex-shrink: 0;
}

.profile-editor-content {
  flex: 1;
  min-height: 0;
  overflow-y: hidden;
}

@media (max-width: 900px) {
  .profile-preview-area {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .profile-detail {
    width: 100%;
    height: auto;
    min-height: min(720px, calc(100vh - 180px));
  }

  .profile-editor {
    width: 100%;
  }
}

.cover-uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cover-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.m-1 {
  margin: 4px;
}

.tag-input-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.contact-form-item {
  background: #f8f9fb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px dashed #dcdfe6;
}

.contact-form-list {
  display: flex;
  flex-direction: column;
}
</style>
