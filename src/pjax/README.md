# PJAX 开发者适配文档

本文档面向需要在 Halo Theme Clarity 主题中适配 PJAX 相关功能开发的开发者。

## 目录

- [PJAX 概述](#pjax-概述)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [生命周期事件](#生命周期事件)
- [组件重新初始化](#组件重新初始化)
- [开发指南](#开发指南)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)
- [参考链接](#参考链接)

---

## PJAX 概述

PJAX（Push-State AJAX）是一种无刷新页面导航技术，它通过 AJAX 加载页面内容并更新 URL，提供流畅的用户体验。

### 启用条件

PJAX 仅在主题配置中显式启用时才会工作：

```javascript
window.themeConfig?.custom?.enable_pjax === true
```

### 选择器配置

```javascript
{
  elements: "a:not([data-no-pjax]):not([target='_blank']):not([href^='#']):not([href^='javascript:'])",
  selectors: ["title", "#main-content", "#z-aside"],
  switches: {
    "#main-content": Pjax.switches.outerHTML,
    "#z-aside": Pjax.switches.outerHTML,
  }
}
```

---

## 架构设计

```
src/pjax/
├── pjax.ts              # PJAX 实例管理（初始化、获取、启用/禁用）
├── pjax-hooks.ts        # Hooks 模块入口，统一导出
├── hooks/               # 事件处理模块
│   ├── index.ts         # 注册所有 PJAX 事件监听器
│   ├── events.ts        # 核心事件处理器（send/complete/success/error）
│   ├── meta.ts          # Meta 标签和 JSON-LD 更新
│   ├── navigation.ts    # 导航状态更新
│   ├── scripts.ts       # 脚本执行
│   └── utils.ts         # 工具函数
└── reinit/              # 组件重新初始化模块
    ├── index.ts         # 统一重新初始化入口
    ├── alpine.ts        # Alpine.js 组件
    ├── back-to-top.ts   # 返回顶部按钮
    ├── image.ts         # 图片加载和说明
    ├── mermaid.ts       # Mermaid 图表
    ├── moments-tags.ts  # 瞬间标签滚动
    ├── navigation.ts    # 导航栏
    └── theme-config.ts  # 主题配置同步
```

---

## 核心模块

### 1. PJAX 实例管理 (pjax.ts)

| 函数 | 说明 |
|------|------|
| `initPjax()` | 初始化 PJAX 实例，仅在启用配置时执行 |
| `getPjaxInstance()` | 获取当前 PJAX 实例 |
| `disablePjax()` | 禁用 PJAX 功能 |
| `enablePjax()` | 启用 PJAX 功能 |

### 2. 事件注册 (hooks/index.ts)

使用 `registerPjaxHooks()` 注册所有 PJAX 生命周期事件监听器。该函数使用标志位防止重复注册。

### 3. 组件重新初始化 (reinit/index.ts)

`reinitializeComponents()` 是 PJAX 页面切换后的统一初始化入口，负责重新初始化所有 UI 组件。

---

## 生命周期事件

PJAX 提供了以下生命周期事件，按执行顺序排列：

### 1. `pjax:send` - 请求发送

**触发时机**：用户点击链接，PJAX 开始加载新页面

**默认行为**：
- 添加 `pjax-loading` 类到 body（显示加载状态）
- 触发自定义事件 `pjax:start`
- 关闭侧边栏和侧边面板

**使用示例**：
```javascript
document.addEventListener('pjax:send', () => {
  // 自定义加载状态逻辑
  console.log('页面加载中...');
});
```

### 2. `pjax:complete` - 请求完成

**触发时机**：PJAX 请求完成（无论成功或失败）

**默认行为**：
- 移除 `pjax-loading` 类
- 滚动到页面顶部
- 触发自定义事件 `pjax:complete`

### 3. `pjax:success` - 请求成功

**触发时机**：PJAX 成功加载并插入新内容

**默认行为**（按执行顺序）：
1. 触发 `pjax:success` 自定义事件
2. 同步主题配置 (`syncThemeConfig`)
3. 执行新脚本 (`executeNewScripts`)
4. 重新初始化组件 (`reinitializeComponents`)
5. 更新导航状态 (`updateActiveNavItem`)
6. 更新 Meta 标签 (`updateMetaTags`)

**使用示例**：
```javascript
document.addEventListener('pjax:success', () => {
  // 在组件重新初始化后执行自定义逻辑
  console.log('页面切换完成');
});
```

### 4. `pjax:error` - 请求错误

**触发时机**：PJAX 请求失败

**默认行为**：
- 移除加载状态
- 触发 `pjax:error` 自定义事件
- 实现重试机制（最多 3 次）
- 超过重试次数后自动禁用 PJAX

---

## 组件重新初始化

### 现有重新初始化组件

| 组件 | 文件 | 说明 |
|------|------|------|
| Alpine.js | `alpine.ts` | 重新初始化未初始化的 x-data 元素 |
| 图片加载 | `image.ts` | 监听图片加载完成事件，添加 loaded 类 |
| 图片说明 | `image.ts` | 为文章图片自动添加 figcaption |
| 返回顶部 | `back-to-top.ts` | 重新绑定滚动事件和按钮交互 |
| 导航栏 | `navigation.ts` | 更新活动导航项状态 |
| Mermaid | `mermaid.ts` | 重新渲染图表 |
| 瞬间标签 | `moments-tags.ts` | 重新初始化标签滚动功能 |
| 主题配置 | `theme-config.ts` | 同步页面主题配置 |

### 添加新的重新初始化组件

在 `reinit/index.ts` 中添加新的初始化函数：

```typescript
// reinit/my-component.ts
export const initMyComponent = () => {
  // 清理旧的事件监听器（重要！）
  cleanupOldListeners();
  
  // 初始化新组件
  const elements = document.querySelectorAll('.my-component');
  elements.forEach(el => {
    // 初始化逻辑
  });
};

// reinit/index.ts
import { initMyComponent } from './my-component';

export const reinitializeComponents = () => {
  // ... 其他初始化
  initMyComponent();  // 添加到这里
};
```

---

## 开发指南

### 1. 监听 PJAX 事件

```javascript
// 在 PJAX 请求开始时执行
document.addEventListener('pjax:send', handler);

// 在 PJAX 请求完成后执行
document.addEventListener('pjax:complete', handler);

// 在 PJAX 成功加载后执行
document.addEventListener('pjax:success', handler);

// 在 PJAX 失败时执行
document.addEventListener('pjax:error', handler);
```

### 2. 排除链接使用 PJAX

在 HTML 中添加 `data-no-pjax` 属性：

```html
<a href="/external-page" data-no-pjax>外部链接</a>
```

或使用其他自动排除的方式：
- `target="_blank"` - 新窗口打开
- `href^="#"` - 锚点链接
- `href^="javascript:"` - JavaScript 伪协议

### 3. 在 PJAX 页面中执行脚本

**方式一：使用内联脚本（自动执行）**

```html
<div id="main-content">
  <script>
    // 这段脚本会在 PJAX 成功后自动执行
    console.log('脚本已执行');
  </script>
</div>
```

**方式二：监听 pjax:success 事件**

```javascript
document.addEventListener('pjax:success', () => {
  // 执行需要在页面切换后运行的代码
  initMyFeature();
});
```

### 4. 更新 Meta 标签

系统会自动更新以下 Meta 标签：

- 基础 SEO：`description`, `keywords`, `author`, `generator`
- Open Graph：`og:*` 系列标签
- Twitter Card：`twitter:*` 系列标签
- 站点验证：百度、Google、Bing
- Canonical Link
- JSON-LD 结构化数据

如需添加自定义 Meta 标签更新，修改 `hooks/meta.ts` 中的 `META_SELECTORS` 数组。

### 5. 错误处理和重试

PJAX 内置了错误重试机制：

- 最多重试 3 次
- 超过重试次数后自动禁用 PJAX
- 使用 `localStorage.setItem('pjax_disabled', 'true')` 标记禁用状态

---

## 最佳实践

### 1. 事件监听器清理

在重新初始化组件时，务必清理旧的事件监听器，避免内存泄漏：

```typescript
let myHandler = null;

export const initMyComponent = () => {
  // 1. 清理旧监听器
  if (myHandler) {
    window.removeEventListener('scroll', myHandler);
  }
  
  // 2. 创建新处理器
  myHandler = () => {
    // 处理逻辑
  };
  
  // 3. 绑定新监听器
  window.addEventListener('scroll', myHandler);
};
```

### 2. 使用 data-pjax 标记

对于需要在 PJAX 切换时替换的元素，使用 `data-pjax` 属性标记：

```html
<meta name="description" content="页面描述" data-pjax="true">
```

### 3. 使用 data-pjax-conditional 条件加载资源

对于只在特定页面需要的样式或脚本，使用 `data-pjax-conditional` 属性标记。系统会在进入页面时自动加载，离开页面时自动卸载。

**使用场景**：
- 特定页面独有的 CSS 样式（如相册页、追番页）
- 特定页面需要的第三方库（如代码高亮、图表库）

**基本用法**：

```html
<!-- 在模板 head 片段中添加条件样式 -->
<th:block th:fragment="head">
  <link
    rel="stylesheet"
    data-pjax-conditional="photos"
    th:href="@{/assets/dist/photos.css}"
  />
</th:block>

<!-- 条件加载脚本 -->
<script data-pjax-conditional="mermaid" src="/assets/lib/mermaid.js"></script>
```

**属性说明**：

| 属性 | 说明 |
|------|------|
| `data-pjax-conditional` | 资源的唯一标识，用于匹配和去重 |

**工作原理**：

1. **预加载**：在 `pjax:send` 事件时，系统会提前加载新页面需要的样式，防止闪烁
2. **加载**：在 `pjax:success` 事件时，系统会加载新页面有而当前页面没有的资源
3. **卸载**：当切换到不需要该资源的页面时，系统会自动移除对应的样式和脚本

**注意事项**：

- `data-pjax-conditional` 的值在同一类型资源（CSS/JS）中应保持唯一
- 样式表必须设置 `rel="stylesheet"`
- 脚本通过 `data-pjax-conditional` 加载时会重新创建并执行
- 如果需要在脚本卸载前清理全局状态，可以监听 `pjax:script:cleanup` 事件

**完整示例**：

```html
<!-- 相册页面模板 -->
<html xmlns:th="http://www.thymeleaf.org">
  <th:block th:fragment="head">
    <!-- 只在相册页面加载的样式 -->
    <link
      rel="stylesheet"
      data-pjax-conditional="photos"
      th:href="@{/assets/dist/photos.css?v={version}(version=${theme.spec.version})}"
    />
    <!-- 只在相册页面加载的脚本 -->
    <script
      data-pjax-conditional="photos"
      th:src="@{/assets/dist/photos.js}"
    ></script>
  </th:block>
  
  <div id="main-content">
    <!-- 相册页面内容 -->
  </div>
</html>
```

### 4. 检测 PJAX 是否启用

```javascript
if (window.themeConfig?.custom?.enable_pjax) {
  // PJAX 已启用，需要适配
} else {
  // PJAX 未启用，使用传统页面加载
}
```

### 5. 区分初始加载和 PJAX 加载

```javascript
// 首次页面加载
document.addEventListener('DOMContentLoaded', () => {
  initMyComponent();
});

// PJAX 页面切换
document.addEventListener('pjax:success', () => {
  initMyComponent();
});
```

### 6. 脚本执行注意事项

PJAX 只更新配置的选择器内容（`#main-content`, `#z-aside`），因此：

- 放在 `<head>` 中的脚本不会被重新执行
- 内联在 `#main-content` 中的脚本会被提取并执行
- 外部脚本（`<script src="...">`）需要特殊处理

---

## 故障排查

### 问题：PJAX 不工作

**检查清单**：
1. 确认主题配置中启用了 PJAX：`window.themeConfig.custom.enable_pjax === true`
2. 检查浏览器控制台是否有 JavaScript 错误
3. 确认链接没有被自动排除（非 `_blank`、非锚点、非 `javascript:`）
4. 检查是否被 `data-no-pjax` 排除

### 问题：组件在 PJAX 切换后不工作

**检查清单**：
1. 确认组件初始化函数已添加到 `reinitializeComponents()`
2. 检查是否正确清理了旧的事件监听器
3. 确认选择器能正确匹配新加载的内容
4. 检查是否有 JavaScript 错误阻止了初始化

### 问题：脚本不执行

**检查清单**：
1. 确认脚本位于 `#main-content` 或 `#z-aside` 内
2. 检查脚本是否有语法错误
3. 确认脚本依赖的库已加载
4. 使用 `pjax:success` 事件替代内联脚本

### 问题：内存泄漏

**症状**：页面切换多次后浏览器变慢

**解决方案**：
1. 确保清理所有事件监听器
2. 清理定时器和动画帧
3. 断开 MutationObserver
4. 避免在闭包中持有 DOM 引用

```typescript
// 良好的清理实践
let observer = null;
let timer = null;

export const initComponent = () => {
  // 清理旧的
  if (observer) {
    observer.disconnect();
  }
  if (timer) {
    clearTimeout(timer);
  }
  
  // 创建新的
  observer = new MutationObserver(callback);
  timer = setTimeout(() => {}, 1000);
};
```

---

## 参考链接

- [Pjax 官方文档](https://github.com/MoOx/pjax)
- [Halo 主题 PJAX 开发实践](https://lixingyong.com/archives/halo-zhu-ti-pjax-zui-jia-shi-jian)