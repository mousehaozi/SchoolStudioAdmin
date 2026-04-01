<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  shadow: {
    type: String,
    default: "hover", // values: always, hover, never
    validator: (val) => ["always", "hover", "never"].includes(val),
  },
  bodyStyle: {
    type: [String, Object],
    default: "",
  },
});
</script>

<template>
  <div class="common-card" :class="[`is-${shadow}-shadow`]">
    <div v-if="$slots.header || title" class="common-card__header">
      <slot name="header">
        <div class="common-card__title">{{ title }}</div>
      </slot>
    </div>

    <div class="common-card__body" :style="bodyStyle">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="common-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-card {
  background: var(--el-bg-color-overlay, #ffffff);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  background-color: #ffffff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.is-always-shadow {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
  }

  &.is-hover-shadow {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.1);
    }
  }

  &.is-never-shadow {
    box-shadow: none;
    border: none; // Often used for nested or transparent cards
    background: transparent;
  }

  // Specific override for "page-card" like usage where we want a steady base
  // We can decide if "never" means "flat but visible" or "transparent".
  // Element Plus "never" usually still has border unless removed.
  // For this "Premium" look, "never" might be cleaner.
  // Let's adjust "never" to be a clean flat card if it has a background.

  // Making it robust:
  &.is-never-shadow {
    box-shadow: none;
    border: 1px solid transparent; // Keep layout stable
    background: #ffffff; // Reset to white, logic below
  }
}

.common-card__header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;

  :deep(> *) {
    width: 100%;
  }

  :deep(.page-title) {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.5px;
  }
}

.common-card__body {
  padding: 24px;
  flex: 1;
}

.common-card__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  box-sizing: border-box;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-end; // Common for pagination/actions
}

// Dark Mode Support (Basic)
@media (prefers-color-scheme: dark) {
  .common-card {
    background-color: #1d1e1f;
    border-color: #434343;

    &__header {
      border-bottom-color: #434343;
      :deep(.page-title) {
        color: #e5eaf3;
      }
    }

    &__footer {
      background-color: #262727;
      border-top-color: #434343;
    }
  }
}
</style>
