# BlueFish Android

BlueFish 是一个独立的 DeepSeek 安卓聊天客户端。可使用自己的 DeepSeek API Key，从设备直接连接 DeepSeek。支持流式聊天、思考和联网、图片与文档、对话版本、DeepSeek 历史导入和跨对话记忆。

- 聊天历史与保存的记忆存放在设备上，API Key 由 Android Keystore 保护。
- 发送消息时，聊天内容、附件和选中的跨对话上下文会发送给所用的推理服务。长对话摘要和可选的「后台整理（Dreaming）」也会调用模型并计入用量。
- 在「设置 → 数据管理 → 导入 DeepSeek 对话」可导入 DeepSeek 的 ZIP 导出或旧版 `conversations.json`。
- 数学公式使用内置 KaTeX 渲染，朗读使用设备上安装的离线语音。

本仓库公开 Android 客户端源码。默认构建仅需自己的 [DeepSeek API Key](https://platform.deepseek.com/api_keys) 即可使用聊天。客户端仍支持试用连接和应用更新，这些功能需要另行配置服务地址。

## 在 Windows 构建

安装 PowerShell 7、JDK 17 或更新版本，以及 Android SDK Platform 36 和 Build Tools 36.0.0。确保 `java`、`javac`、`jar` 和 `keytool` 在 PATH 中。从仓库根目录运行以下命令，并按需调整 SDK 路径。

```powershell
$sdk = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
./build.ps1 -AndroidJar (Join-Path $sdk 'platforms/android-36/android.jar') -BuildTools (Join-Path $sdk 'build-tools/36.0.0')
```

签名 APK 位于 `dist/BlueFish-<version>.apk`，支持 Android 8.0 或更新版本，设备需启用现代 Android System WebView。首次构建会生成独立的本地签名密钥，存放在 `.android-build/signing/`。请保留签名目录的备份，以便覆盖安装后续自建版本。设备上已有签名不同的 BlueFish 时，Android 会拒绝覆盖安装。

如已有兼容服务，可在构建时显式传入 `-TrialOrigin`、`-UpdateR2Origin` 或 `-UpdateTunnelOrigin`。参数接受只含主机和可选端口的 HTTPS 地址。

## 运行测试

安装 Node.js 24，在仓库根目录运行。

```powershell
node --test tests/*.test.mjs
```

测试覆盖应用启动、数学公式渲染和 DeepSeek 历史导入，无需网络或 API Key。

## 许可证

项目自有代码使用 [MIT 许可证](LICENSE)。随客户端分发的 [markdown-it](android/assets/markdown-it-LICENSE.txt) 和 [KaTeX](android/assets/katex/LICENSE) 保留各自原有的 MIT 许可与版权声明。
