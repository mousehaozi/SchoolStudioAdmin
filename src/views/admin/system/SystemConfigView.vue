<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Refresh, Edit } from "@element-plus/icons-vue";
import { getAdminSystemConfigs, upsertAdminSystemConfig } from "@/api/admin";
import CommonCard from "@/components/CommonCard.vue";

import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const list = ref([]);
const dialogVisible = ref(false);
const dialogMode = ref("create");
const formRef = ref(null);

const form = reactive({
  key: "",
  value: "",
});

const rules = {
  key: [{ required: true, message: "请输入配置键", trigger: "blur" }],
  value: [{ required: true, message: "请输入配置值", trigger: "blur" }],
};

const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "新增配置" : "编辑配置"
);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getAdminSystemConfigs();
    list.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("获取配置列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  dialogMode.value = "create";
  form.key = "";
  form.value = "";
  dialogVisible.value = true;
};

const openEdit = (row) => {
  dialogMode.value = "edit";
  form.key = row.key;
  form.value = row.value;
  dialogVisible.value = true;
};

const submit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await upsertAdminSystemConfig({
        key: form.key,
        value: form.value,
      });
      ElMessage.success("操作成功");
      dialogVisible.value = false;
      fetchList();
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      saving.value = false;
    }
  });
};

onMounted(() => {
  if (userStore.role !== "SUPERADMIN") {
    ElMessage.error("无权访问该页面");
    router.push("/admin");
    return;
  }
  fetchList();
});
</script>

<template>
  <div class="page">
    <CommonCard shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div class="page-title">系统配置</div>
          <div class="page-actions">
            <el-button type="primary" plain :icon="Plus" @click="openCreate">
              新增配置
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

      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%"
        size="small"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="key" label="配置键 (Key)" width="150" />
        <el-table-column
          prop="value"
          label="配置值 (Value)"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" plain :icon="Edit" @click="openEdit(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </CommonCard>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
      align-center
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="配置键" prop="key">
          <el-input
            v-model="form.key"
            placeholder="请输入配置键"
            :disabled="dialogMode === 'edit'"
          />
          <div v-if="dialogMode === 'edit'" class="form-tip">
            配置键在保存后不可修改
          </div>
        </el-form-item>
        <el-form-item label="配置值" prop="value">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="4"
            placeholder="请输入配置值"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
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
  gap: 10px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1;
}
</style>
