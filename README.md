[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/iteng007-v2ex-mcp-server-badge.png)](https://mseep.ai/app/iteng007-v2ex-mcp-server)

# V2EX MCP Server

通过 MCP (Model Context Protocol) 协议访问 V2EX API 的服务器。

## 功能特性

- ✅ 获取最新主题列表
- ✅ 获取热门主题列表
- ✅ 获取主题详情
- ✅ 获取主题回复
- ✅ 获取节点信息
- ✅ 获取节点主题列表
- ✅ 搜索提示（V2EX 无官方搜索 API）

## 安装

```bash
cd v2ex-mcp-server
npm install
```

## 使用方法

### 1. 配置 mcporter

在 `~/.openclaw/workspace/config/mcporter.json` 中添加：

```json
{
  "mcpServers": {
    "v2ex": {
      "command": "node /home/father/.openclaw/workspace/v2ex-mcp-server/index.js"
    }
  }
}
```

### 2. 测试工具

```bash
# 列出所有工具
mcporter list v2ex

# 获取最新主题
mcporter call v2ex v2ex_get_latest '{}'

# 获取热门主题
mcporter call v2ex v2ex_get_hot '{}'

# 获取主题详情
mcporter call v2ex v2ex_get_topic '{"id": 123456}'

# 获取主题回复
mcporter call v2ex v2ex_get_replies '{"id": 123456, "page": 1}'

# 获取节点信息
mcporter call v2ex v2ex_get_node '{"name": "python"}'

# 获取节点主题
mcporter call v2ex v2ex_get_node_topics '{"name": "python", "page": 1}'

# 搜索（返回 Google 搜索链接）
mcporter call v2ex v2ex_search '{"query": "vibe coding"}'
```

## 可用工具

### v2ex_get_latest
获取 V2EX 最新主题列表

参数：
- `page` (可选): 页码，默认为 1

### v2ex_get_hot
获取 V2EX 热门主题列表

参数：无

### v2ex_get_topic
获取 V2EX 主题详情

参数：
- `id` (必需): 主题 ID

### v2ex_get_replies
获取 V2EX 主题的回复列表

参数：
- `id` (必需): 主题 ID
- `page` (可选): 页码，默认为 1

### v2ex_get_node
获取 V2EX 节点信息

参数：
- `name` (必需): 节点名称，如 'python', 'programmer' 等

### v2ex_get_node_topics
获取 V2EX 节点下的主题列表

参数：
- `name` (必需): 节点名称
- `page` (可选): 页码，默认为 1

### v2ex_search
搜索 V2EX 主题（返回 Google 站内搜索链接）

参数：
- `query` (必需): 搜索关键词

## API 说明

本项目使用 V2EX 官方 API v2：
- 基础 URL: `https://www.v2ex.com/api/v2`
- 无需认证即可访问公开内容
- 请遵守 V2EX API 使用规范，避免频繁请求

## 常见节点

- `python` - Python
- `programmer` - 程序员
- `jobs` - 酷工作
- `qna` - 问与答
- `share` - 分享发现
- `create` - 分享创造
- `apple` - Apple
- `android` - Android
- `linux` - Linux
- `nodejs` - Node.js
- `go` - Go 编程语言
- `rust` - Rust

## 注意事项

1. V2EX API 有访问频率限制，请合理使用
2. 搜索功能由于 V2EX 无官方 API，返回的是 Google 站内搜索链接
3. 部分内容可能需要登录才能访问（本 MCP Server 暂不支持认证）

## 许可证

MIT
