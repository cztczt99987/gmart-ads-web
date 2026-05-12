# TikTok 内容分享指南

> 原文链接: https://developers.tiktok.com/doc/content-sharing-guidelines

## 目录

- [通用指南](#通用指南)
- [水印指南](#水印指南)
- [Direct Post API - 开发者指南](#direct-post-api---开发者指南)
  - [未审核 API 客户端限制](#未审核-api-客户端限制)
  - [审核和未审核 API 客户端均适用的限制](#审核和未审核-api-客户端均适用的限制)
  - [预期用途](#预期用途)
  - [必需的 UX 实现要求](#必需的-ux-实现要求)
  - [技术注意事项](#技术注意事项)

---

## 通用指南

TikTok 期望开发者避免向发布到 TikTok 的内容添加不必要的材料。

---

## 水印指南

**禁止添加以下内容到分享至 TikTok 的内容中：**

- ❌ 品牌名称
- ❌ Logo
- ❌ 水印
- ❌ 其他促销品牌标识
- ❌ 链接或促销文字

> ⚠️ **警告**: 违反这些指南可能导致内容被删除或账户被禁用。

---

## Direct Post API - 开发者指南

Direct Post API 允许开发者在应用中构建"分享到 TikTok"功能，使创作者能够直接将内容分享到他们的 TikTok 个人资料。

### 未审核 API 客户端限制

如果您的 API 客户端尚未通过审核，将适用以下限制：

| 限制类型 | 说明 |
| --- | --- |
| **用户上限** | 未审核的 API 客户端在 24 小时内最多允许 5 位用户发布内容 |
| **账户私密性** | 使用 API 客户端发布内容的所有用户账户在发布时必须设置为私密 |
| **私密可见性** | 未审核的 API 客户端只能以 `SELF_ONLY`（仅自己可见）模式发布内容 |

> 📝 **注意**: 要使内容稍后公开可见，账户所有者必须先将账户可见性更改为公开，然后将每项内容的隐私设置更改为"所有人"。

### 审核和未审核 API 客户端均适用的限制

| 限制类型 | 说明 |
| --- | --- |
| **创作者上限** | 每个 API 客户端将根据审核申请表中提供的使用估算设置 24 小时活跃创作者上限 |
| **发布上限** | 通过 Direct Post API 在 24 小时内向创作者账户发布的帖子数量有限制（通常每位创作者每天约 15 个帖子），该上限在使用 Direct Post 的所有 API 客户端之间共享 |

---

### 预期用途

#### ✅ 可接受的使用方式

API 客户端应促进真实创作者将原创内容发布到 TikTok。

#### ❌ 不可接受的使用方式

1. **跨平台复制应用**: 从其他平台复制任意内容到 TikTok 的应用
2. **内部工具**: 仅限于测试应用，或仅限于内部群体/私人使用的实用工具（帮助上传内容到您或您团队管理的账户的工具）

---

### 必需的 UX 实现要求

#### 1. 获取最新创作者信息

在渲染"发布到 TikTok"页面时，API 客户端必须检索最新的创作者信息：

| 要求 | 说明 |
| --- | --- |
| **显示昵称** | 上传页面必须显示创作者的昵称，以便用户知道内容将上传到哪个 TikTok 账户 |
| **发布限制检查** | 当 `creator_info API` 返回创作者此刻无法发布更多内容时，必须停止当前发布尝试并提示用户稍后重试 |
| **视频时长检查** | 发布视频时，必须检查待发布视频的时长是否符合 `creator_info API` 返回的 `max_video_post_duration_sec` |

#### 2. 元数据输入/选择

API 客户端必须允许用户输入或选择以下元数据：

##### a) 标题 (Title)

用户必须能够输入帖子标题。

##### b) 隐私状态 (Privacy Status)

- 选项必须遵循 `creator_info API` 返回的 `privacy_level_options`
- 用户必须从下拉菜单中**手动选择**隐私状态
- **不应有默认值**

##### c) 互动能力 (Interaction Ability)

包括：允许评论、合拍 (Duet)、拼接 (Stitch)

| 要求 | 说明 |
| --- | --- |
| **禁用灰色显示** | 如果 `creator_info API` 返回某些互动功能在其应用设置中已被禁用，则必须禁用并灰显该互动功能的复选框 |
| **手动开启** | 用户必须手动开启这些互动设置，默认都不应被选中 |
| **图片帖子限制** | 合拍和拼接功能不适用于图片帖子，因此对于图片帖子，UX 中只能显示"允许评论" |

> ⚠️ **重要声明**: 在允许用户通过您的平台发布之前，必须有一个声明，在发布按钮之前征求用户的同意。应明确说明：
>
> **"By posting, you agree to TikTok's Music Usage Confirmation"** （发布即表示您同意 TikTok 的音乐使用确认）

#### 3. 商业内容披露

API 客户端必须允许用户披露商业内容：

##### a) 内容披露设置

| 选项 | 说明 | 标签提示 |
| --- | --- | --- |
| **您的品牌 (Your Brand)** | 推广自己或自己的业务，内容将被分类为品牌有机内容 | "Your photo/video will be labeled as 'Promotional content'" |
| **品牌内容 (Branded Content)** | 推广其他品牌或第三方，内容将被分类为品牌内容 | "Your photo/video will be labeled as 'Paid partnership'" |
| **两者都选** | 如果两个选项都被选中 | "Your photo/video will be labeled as 'Paid partnership'" |

**交互规则：**

- 默认状态：**关闭**
- 多选：至少必须选择一个选项才能继续发布
- 如果商业内容披露开关**打开**但没有选择任何选项，发布按钮应**禁用**
- 悬停提示："You need to indicate if your content promotes yourself, a third party, or both"

##### b) 隐私管理

| 场景 | 处理方式 |
| --- | --- |
| 用户选择"品牌内容" | 只能配置为公开/好友可见性 |
| 可见性设置为"私密"（仅我） | 选项A：禁用"品牌内容"选项，告知用户品牌内容的可见性不能是私密的<br>选项B：自动将可见性设置切换为公开，并告知用户 |

> 💡 **悬停提示**: 如果用户已开启商业内容披露开关并勾选了品牌内容选项，"仅我"权限应被禁用，悬停时显示提示："Branded content visibility cannot be set to private."

#### 4. 合规要求

根据商业内容选择显示不同的声明：

| 选择 | 声明内容 |
| --- | --- |
| 仅"您的品牌" | "By posting, you agree to TikTok's Music Usage Confirmation." |
| 仅"品牌内容" | "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation." |
| 两者都选 | "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation." |

#### 5. 用户意识和控制

API 客户端的用户必须对其发布到 TikTok 账户的内容有充分的意识和控制：

| 要求 | 说明 |
| --- | --- |
| **内容预览** | 应显示待发布内容的预览 |
| **禁止添加水印/Logo** | 不应向创作者的内容添加促销水印/Logo |
| **可编辑预设文本** | 标题字段或标签中的任何预设文本应允许用户在发布内容前编辑 |
| **明确同意** | 必须仅在用户明确同意上传后，才开始向 TikTok 发送内容材料 |
| **处理时间通知** | 必须明确通知用户，完成发布后，可能需要几分钟时间处理内容才能在其个人资料上可见 |
| **状态轮询** | 应轮询 `publish/status/fetch API` 或处理状态更新 webhook，以便用户了解其帖子的状态 |

---

### 技术注意事项

#### 1. 保护 client_secret 机密性

| 要求 | 说明 |
| --- | --- |
| **禁止共享** | 不得与任何其他第三方共享您的 API 凭据 |
| **禁止嵌入开源** | 不得将 client_secret 嵌入开源项目 |
| **安全控制** | 维护适当的技术和管理控制，确保 client_secret 的安全性和机密性 |

#### 2. 选择高效的内容传输方式

| 方式 | 使用场景 | 要求 |
| --- | --- | --- |
| **PULL_FROM_URL** | 当 API 客户端已将待发布内容存储在服务器端文件存储服务上时 | 提供的 URL 必须位于 API 客户端拥有所有权的域名或 URL 前缀路径下，所有权需要通过 TT4D 应用中"管理应用"页面上的"管理 URL 属性"流程进行验证 |
| **FILE_UPLOAD** | 当待发布的视频位于 API 客户端的用户设备（PC、Mac、Switch 等）上时 | - |

> ⚠️ **重要**: 如果视频资源已经在 API 客户端的服务器上，请勿使用 `FILE_UPLOAD`，应使用 `PULL_FROM_URL`。

---

## 快速检查清单

### 发布前检查

- [ ] 显示创作者昵称
- [ ] 检查创作者发布限制
- [ ] 检查视频时长限制
- [ ] 用户手动选择隐私状态（无默认值）
- [ ] 用户手动开启互动设置（无默认选中）
- [ ] 显示音乐使用确认声明
- [ ] 商业内容披露设置正确
- [ ] 品牌内容隐私限制正确处理
- [ ] 显示内容预览
- [ ] 无水印/Logo 添加
- [ ] 用户明确同意后才开始上传

### 技术检查

- [ ] client_secret 未暴露
- [ ] 使用正确的内容传输方式
- [ ] URL 所有权已验证（如使用 PULL_FROM_URL）
- [ ] 实现状态轮询或 webhook 处理

---

## 参考链接

- [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines)
- [TikTok Developer Portal](https://developers.tiktok.com/)
