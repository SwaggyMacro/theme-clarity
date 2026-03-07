import { reinitializeComponents, syncThemeConfig } from "../reinit";
import { handlePjaxSend, handlePjaxComplete, createPjaxSuccessHandler, handlePjaxError } from "./events";

let isPjaxHooksRegistered = false;

/**
 * 注册PJAX相关的事件监听器
 *
 * 该函数负责设置PJAX生命周期各个阶段的事件处理，
 * 包括发送、完成、成功和错误等事件的处理逻辑。
 * 使用标志位防止重复注册，避免事件监听器重复绑定导致的内存泄漏和逻辑错误。
 */
export const registerPjaxHooks = () => {
  if (isPjaxHooksRegistered) {
    return;
  }
  isPjaxHooksRegistered = true;

  /**
   * 监听PJAX发送事件
   * 在PJAX请求开始时执行，用于显示加载状态和隐藏侧边栏
   */
  document.addEventListener("pjax:send", handlePjaxSend);

  /**
   * 监听PJAX完成事件
   * 在PJAX请求完成后执行，用于移除加载状态并滚动到顶部
   */
  document.addEventListener("pjax:complete", handlePjaxComplete);

  /**
   * 监听PJAX成功事件
   * 在PJAX请求成功后执行，用于重新初始化组件和更新导航状态
   * 包括同步主题配置、执行新脚本、重新初始化组件和更新活动导航项
   */
  document.addEventListener("pjax:success", createPjaxSuccessHandler(reinitializeComponents, syncThemeConfig));

  /**
   * 监听PJAX错误事件
   * 处理PJAX请求失败的情况，包括重试机制和最终禁用PJAX功能
   */
  document.addEventListener("pjax:error", handlePjaxError);
};

export { updateMetaTags, preloadConditionalStyles } from "./meta";
export { updateActiveNavItem } from "./navigation";
export { executeNewScripts } from "./scripts";
export { getRequestFromPjaxEvent, getMetaKey, isPathMatch } from "./utils";
