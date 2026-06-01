# 隐私与合规说明

本文是客户端实现说明，不替代正式法律文本。正式上线前，请运营或法务把这里的条目整理为微信后台可访问的用户协议和隐私政策页面。

## 合规入口

- 登录页：用户协议、隐私政策、适龄提示、健康游戏提示。
- 设置页：用户协议、隐私政策、适龄提示、健康游戏提示、帮助中心、联系客服。
- 协议状态：`SaveManager.settings.acceptedAgreement`。
- 合规服务：`ComplianceService` 提供文档列表、协议门禁、设置页入口数据。

## 用户协议要点

- 玩家需要同意用户协议和隐私政策后才能进入游戏。
- 当前 MVP 不接入真实支付。
- 激励视频广告完整观看后才发放广告奖励；取消、失败、无库存不发放广告奖励。
- 禁止外挂、脚本、刷奖励等破坏公平体验的行为。
- Mock 登录、Mock 广告、Mock 排行榜仅用于 Cocos 编辑器或非微信环境预览。

## 隐私政策要点

- 微信登录：客户端调用 `wx.login` 获取临时 code；openId/session_key 必须由服务端换取，客户端不保存 AppSecret。
- 用户信息：头像昵称只在玩家主动授权后获取；拒绝授权时使用默认昵称头像。
- 本地存档：保存资源、进度、背包、宠物、天赋、任务、设置、每日广告次数等必要数据。
- 广告：使用微信激励视频广告能力；客户端记录广告结果和观看次数，用于奖励发放和任务进度。
- 排行榜：预留微信开放数据域，只提交分数和更新时间等必要字段。
- 分享：分享 query 不得携带 token、手机号、身份证号、真实 openId 等敏感信息。

## 适龄与健康游戏

- 适龄提示：`16+ CADPA`。
- 健康游戏提示：适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。
- 未成年人保护：如果后续接入支付、活动或更强留存系统，需要补充实名认证、防沉迷、充值限制等规则。

## 客户端接口映射

- `WechatService.login`：微信登录；非微信环境返回 Mock 登录结果。
- `WechatService.getUserProfile`：头像昵称授权；拒绝授权也有明确状态。
- `WechatService.setStorage/getStorage/removeStorage`：微信 storage 与编辑器本地存储 fallback。
- `WechatService.vibrateShort/vibrateLong`：震动能力，尊重玩家设置开关。
- `AdService.showRewardedAd`：激励视频广告，返回成功、取消、失败、无库存、不可用。
- `ShareService.shareAppMessage`：主动分享；非微信环境返回 Mock。
- `LeaderboardService.submitScore`：排行榜分数提交；非微信环境写入 Mock 排行榜。
- `ComplianceService.canEnterGame`：登录协议门禁。

## 上线前必须补齐

- 正式用户协议 URL 或页面。
- 正式隐私政策 URL 或页面。
- 客服联系方式。
- 真实广告位配置。
- 服务端登录换 openId 的接口。
- 开放数据域排行榜界面。
- 数据删除、客服申诉、账号异常处理说明。
