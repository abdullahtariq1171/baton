import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "baton-server", version: "1.0.0" });
// ... register tools, resources, prompts ... Later

server.registerTool(
  "baton_ping",
  {
    description: "Echoes back the input string",
    inputSchema: { input: z.string() },
  },
  async ({ input }) => ({ content: [{ type: "text", text: input }] }),
);

const transport = new StdioServerTransport();

await server.connect(transport);
