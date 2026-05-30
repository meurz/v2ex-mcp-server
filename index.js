#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";

const V2EX_API_BASE = "https://www.v2ex.com/api";

// 创建 axios 实例
const api = axios.create({
  baseURL: V2EX_API_BASE,
  timeout: 10000,
  headers: {
    "User-Agent": "V2EX-MCP-Server/1.0",
  },
});

// 工具定义
const TOOLS = {
  v2ex_get_latest: {
    name: "v2ex_get_latest",
    description: "获取 V2EX 最新主题列表",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "页码，默认为 1",
          default: 1,
        },
      },
    },
  },
  v2ex_get_hot: {
    name: "v2ex_get_hot",
    description: "获取 V2EX 热门主题列表",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  v2ex_get_topic: {
    name: "v2ex_get_topic",
    description: "获取 V2EX 主题详情",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "主题 ID",
        },
      },
      required: ["id"],
    },
  },
  v2ex_get_replies: {
    name: "v2ex_get_replies",
    description: "获取 V2EX 主题的回复列表",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "主题 ID",
        },
        page: {
          type: "number",
          description: "页码，默认为 1",
          default: 1,
        },
      },
      required: ["id"],
    },
  },
  v2ex_get_node: {
    name: "v2ex_get_node",
    description: "获取 V2EX 节点信息",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "节点名称，如 'python', 'programmer' 等",
        },
      },
      required: ["name"],
    },
  },
  v2ex_get_node_topics: {
    name: "v2ex_get_node_topics",
    description: "获取 V2EX 节点下的主题列表",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "节点名称，如 'python', 'programmer' 等",
        },
        page: {
          type: "number",
          description: "页码，默认为 1",
          default: 1,
        },
      },
      required: ["name"],
    },
  },
  v2ex_search: {
    name: "v2ex_search",
    description: "搜索 V2EX 主题（使用 Google 站内搜索）",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索关键词",
        },
      },
      required: ["query"],
    },
  },
};

// API 调用函数
async function getLatestTopics(page = 1) {
  try {
    const response = await api.get(`/topics/latest.json`, {
      params: { p: page },
    });
    return response.data;
  } catch (error) {
    throw new Error(`获取最新主题失败: ${error.message}`);
  }
}

async function getHotTopics() {
  try {
    const response = await api.get(`/topics/hot.json`);
    return response.data;
  } catch (error) {
    throw new Error(`获取热门主题失败: ${error.message}`);
  }
}

async function getTopic(id) {
  try {
    const response = await api.get(`/topics/show.json`, {
      params: { id },
    });
    return response.data;
  } catch (error) {
    throw new Error(`获取主题详情失败: ${error.message}`);
  }
}

async function getReplies(id, page = 1) {
  try {
    const response = await api.get(`/replies/show.json`, {
      params: { topic_id: id, page },
    });
    return response.data;
  } catch (error) {
    throw new Error(`获取回复列表失败: ${error.message}`);
  }
}

async function getNode(name) {
  try {
    const response = await api.get(`/nodes/show.json`, {
      params: { name },
    });
    return response.data;
  } catch (error) {
    throw new Error(`获取节点信息失败: ${error.message}`);
  }
}

async function getNodeTopics(name, page = 1) {
  try {
    const response = await api.get(`/topics/show.json`, {
      params: { node_name: name, p: page },
    });
    return response.data;
  } catch (error) {
    throw new Error(`获取节点主题失败: ${error.message}`);
  }
}

async function searchTopics(query) {
  // V2EX 没有官方搜索 API，这里返回提示信息
  return {
    message: "V2EX 暂无官方搜索 API，建议使用 Google 搜索：site:v2ex.com " + query,
    google_search_url: `https://www.google.com/search?q=site:v2ex.com+${encodeURIComponent(query)}`,
  };
}

// 格式化主题列表
function formatTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) {
    return "没有找到主题";
  }

  return topics
    .map((topic, index) => {
      const node = topic.node ? `[${topic.node.title}]` : "";
      const replies = topic.replies > 0 ? `💬 ${topic.replies}` : "";
      return `${index + 1}. ${node} ${topic.title}\n   👤 ${topic.member.username} | ${replies} | ID: ${topic.id}`;
    })
    .join("\n\n");
}

// 格式化主题详情
function formatTopic(topic) {
  const node = topic.node ? `[${topic.node.title}]` : "";
  const content = topic.content_rendered || topic.content || "无内容";
  
  return `${node} ${topic.title}

作者: ${topic.member.username}
回复数: ${topic.replies}
创建时间: ${new Date(topic.created * 1000).toLocaleString("zh-CN")}
最后回复: ${topic.last_modified ? new Date(topic.last_modified * 1000).toLocaleString("zh-CN") : "无"}

内容:
${content}

链接: https://www.v2ex.com/t/${topic.id}`;
}

// 格式化回复列表
function formatReplies(replies) {
  if (!Array.isArray(replies) || replies.length === 0) {
    return "暂无回复";
  }

  return replies
    .map((reply, index) => {
      const content = reply.content_rendered || reply.content || "无内容";
      const time = new Date(reply.created * 1000).toLocaleString("zh-CN");
      return `${index + 1}. ${reply.member.username} (${time})\n${content}`;
    })
    .join("\n\n---\n\n");
}

// 格式化节点信息
function formatNode(node) {
  return `节点: ${node.title} (${node.name})

简介: ${node.header || "无"}
主题数: ${node.topics}
收藏数: ${node.stars || 0}

链接: https://www.v2ex.com/go/${node.name}`;
}

// 创建服务器
const server = new Server(
  {
    name: "v2ex-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(TOOLS),
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "v2ex_get_latest": {
        const page = args.page || 1;
        const topics = await getLatestTopics(page);
        return {
          content: [
            {
              type: "text",
              text: `V2EX 最新主题 (第 ${page} 页):\n\n${formatTopics(topics)}`,
            },
          ],
        };
      }

      case "v2ex_get_hot": {
        const topics = await getHotTopics();
        return {
          content: [
            {
              type: "text",
              text: `V2EX 热门主题:\n\n${formatTopics(topics)}`,
            },
          ],
        };
      }

      case "v2ex_get_topic": {
        const topic = await getTopic(args.id);
        return {
          content: [
            {
              type: "text",
              text: formatTopic(topic),
            },
          ],
        };
      }

      case "v2ex_get_replies": {
        const page = args.page || 1;
        const replies = await getReplies(args.id, page);
        return {
          content: [
            {
              type: "text",
              text: `主题 ${args.id} 的回复 (第 ${page} 页):\n\n${formatReplies(replies)}`,
            },
          ],
        };
      }

      case "v2ex_get_node": {
        const node = await getNode(args.name);
        return {
          content: [
            {
              type: "text",
              text: formatNode(node),
            },
          ],
        };
      }

      case "v2ex_get_node_topics": {
        const page = args.page || 1;
        const topics = await getNodeTopics(args.name, page);
        return {
          content: [
            {
              type: "text",
              text: `节点 ${args.name} 的主题 (第 ${page} 页):\n\n${formatTopics(topics)}`,
            },
          ],
        };
      }

      case "v2ex_search": {
        const result = await searchTopics(args.query);
        return {
          content: [
            {
              type: "text",
              text: `${result.message}\n\n搜索链接: ${result.google_search_url}`,
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("V2EX MCP Server 已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
