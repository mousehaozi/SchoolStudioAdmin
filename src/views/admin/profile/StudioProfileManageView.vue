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
              v-if="profileList.length > 1"
              v-model="selectedProfileId"
              placeholder="请选择工作室"
              style="width: 220px; margin-right: 12px"
              @change="handleProfileChange"
            >
              <el-option
                v-for="item in profileList"
                :key="item.id"
                :label="getStudioName(item.studioId)"
                :value="item.id"
              />
            </el-select>

            <el-button
              type="primary"
              plain
              :icon="Edit"
              :disabled="!currentProfile"
              @click="openOverwrite"
              >编辑简介</el-button
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

      <div v-loading="loading">
        <div v-if="currentProfile" class="profile-detail">
          <div class="profile-header">
            <el-image
              v-if="currentProfile.coverUrl"
              :src="currentProfile.coverUrl"
              fit="contain"
              class="profile-cover"
              :preview-src-list="[currentProfile.coverUrl]"
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
                v-html="currentProfile.contentHtml"
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
                    <el-icon><CollectionTag /></el-icon>
                    {{ contact.distraction || "-" }}
                  </div>
                  <div class="contact-details">
                    <div class="detail-row">
                      <el-icon><User /></el-icon>
                      <span class="name">{{ contact.name }}</span>
                    </div>
                    <div class="detail-row">
                      <el-icon><Phone /></el-icon>
                      <span class="phone">{{ contact.phone }}</span>
                    </div>
                    <div v-if="contact.wechatUrl" class="detail-row">
                      <el-icon><Link /></el-icon>
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
            profileList.length > 0
              ? '请在上方选择工作室以查看详情'
              : '暂无简介数据'
          "
        >
          <template #image>
            <el-icon
              v-if="profileList.length > 0"
              style="
                font-size: 48px;
                color: var(--el-color-primary);
                opacity: 0.5;
              "
              ><School
            /></el-icon>
          </template>
        </el-empty>
      </div>
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      title="编辑当前简介"
      width="960px"
      destroy-on-close
      align-center
      top="5vh"
      fullscreen
    >
      <div style="padding-right: 10px; padding-bottom: 20px;">
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
                @close="removeOrgTag(tag)"
                class="m-1"
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
              <div class="cover-preview" v-if="form.coverUrl">
                <el-image
                  :src="form.coverUrl"
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
              style="
                border: 1px solid #ccc;
                width: 100%;
                border-radius: 4px;
                position: relative;
                z-index: 99;
              "
            >
              <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                :mode="mode"
              />
              <Editor
                style="height: 400px; overflow-y: hidden"
                v-model="form.contentHtml"
                :defaultConfig="editorConfig"
                :mode="mode"
                @onCreated="handleCreated"
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

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
} from "vue";
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
const selectedProfileId = ref(null);
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
    const res = await uploadAdminImage(compressedFile, (p) => (coverProgress.value = p));
    const url = res.data?.data?.url;
    if (url) {
      form.coverUrl = url;
      ElMessage.success("封面上传成功");
    } else {
      ElMessage.error("上传失败：未返回URL");
    }
  } catch (e) {
    ElMessage.error("上传出错");
  } finally {
    coverProgressVisible.value = false;
  }
}

// Editor
const editorRef = shallowRef();
const mode = "default";
const toolbarConfig = {
  // excludeKeys: ["group-video"], // Remove upload video menu
};
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        let loadingInstance = ElLoading.service({
          text: '图片处理中...',
          background: 'rgba(255, 255, 255, 0.7)',
        });
        try {
          const compressedFile = await compressToWebp(file);
          if (loadingInstance) {
            loadingInstance.setText('图片上传中... 0%');
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
          text: '视频上传中... 0%',
          background: 'rgba(255, 255, 255, 0.7)',
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
};

async function fetchList() {
  loading.value = true;
  try {
    // 获取工作室列表以获取名称
    try {
      const sRes = await getAdminStudios();
      const sList = sRes.data?.data || [];
      studioMap.value = {};
      sList.forEach((s) => {
        studioMap.value[s.id] = s.name;
      });
    } catch (e) {
      console.error("Fetch studios failed", e);
    }

    const res = await getAdminStudioProfiles();
    const data = res.data?.data;
    profileList.value = Array.isArray(data) ? data : [];

    if (profileList.value.length === 1) {
      // 只有一个时，自动选择
      selectedProfileId.value = profileList.value[0].id;
      currentProfile.value = profileList.value[0];
    } else if (profileList.value.length > 1) {
      // 多个时，如果之前没选过或者选的已经不在列表中了，就不自动选
      if (
        !selectedProfileId.value ||
        !profileList.value.find((p) => p.id === selectedProfileId.value)
      ) {
        selectedProfileId.value = null;
        currentProfile.value = null;
      } else {
        currentProfile.value = profileList.value.find(
          (p) => p.id === selectedProfileId.value,
        );
      }
    } else {
      currentProfile.value = null;
      selectedProfileId.value = null;
    }
  } finally {
    loading.value = false;
  }
}

function handleProfileChange(id) {
  const profile = profileList.value.find((p) => p.id === id);
  if (profile) {
    currentProfile.value = profile;
  }
}

function getStudioName(studioId) {
  return studioMap.value[studioId] || `工作室 (ID: ${studioId})`;
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
    form.studioId = null;
  }
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!form.studioId) {
      ElMessage.warning("请先选择所属工作室");
      return;
    }
    saving.value = true;
    try {
      const { studioId, ...restForm } = form;
      await overwriteAdminCurrentStudioProfile(
        {
          id: currentProfile.value?.id,
          ...restForm,
          orgStructure: JSON.stringify(form.orgStructure),
          contactUs: JSON.stringify(form.contactUs),
        },
        studioId,
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
.profile-detail {
  padding: 0 10px 20px;
}
.profile-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #f0f3f8;
}
.profile-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.profile-cover {
  width: 280px;
  height: 157px;
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
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.profile-meta {
  color: #909399;
  font-size: 14px;
}

.profile-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.info-section {
  background: #fff;
}

.info-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
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
  font-size: 16px;
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

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
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
  align-items: center;
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
  padding: 10px;
}
.wechat-link {
  color: #67c23a;
  word-break: break-all;
  font-size: 13px;
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
