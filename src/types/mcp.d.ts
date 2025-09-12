declare module "@modelcontextprotocol/sdk/server" {
  export class McpServer {
    constructor(info: { name: string; version: string });
    tool(
      name: string,
      definition: any,
      handler: (args: any, context?: any) => Promise<any>
    ): void;
    connect(transport: any): Promise<void>;
  }
}

declare module "@modelcontextprotocol/sdk/server/stdio" {
  export class StdioServerTransport {
    constructor();
  }
}

