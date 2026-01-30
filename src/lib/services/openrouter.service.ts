import type { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions<T> {
  model: string;
  schema?: ZodSchema<T>;
  schemaName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult<T> {
  content: string | T;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface OpenRouterConfig {
  apiKey?: string;
  siteUrl?: string;
  appName?: string;
  timeoutMs?: number;
}

export class OpenRouterConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigurationError";
  }
}

export class OpenRouterApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "OpenRouterApiError";
    this.status = status;
    this.code = code;
  }
}

export class OpenRouterParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterParseError";
  }
}

export class OpenRouterTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

interface OpenRouterCompletionResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export class OpenRouterService {
  private apiKey: string;
  private siteUrl: string;
  private appName: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private timeoutMs: number;
  private maxMessageLength = 8_000;
  private maxTotalLength = 32_000;

  constructor(config?: OpenRouterConfig) {
    const apiKey = config?.apiKey ?? import.meta.env.OPENROUTER_API_KEY;
    const siteUrl = config?.siteUrl ?? import.meta.env.OPENROUTER_SITE_URL;
    const appName = config?.appName ?? import.meta.env.OPENROUTER_APP_NAME;

    if (!apiKey) {
      throw new OpenRouterConfigurationError("Missing OPENROUTER_API_KEY");
    }

    this.apiKey = apiKey;
    this.siteUrl = siteUrl;
    this.appName = appName;
    this.timeoutMs = config?.timeoutMs ?? 30_000;
  }

  async complete<T>(messages: Message[], options: CompletionOptions<T>): Promise<CompletionResult<T>> {
    this.validateMessages(messages);

    const body: Record<string, unknown> = {
      model: options.model,
      messages,
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    if (options.schema) {
      const schemaName = options.schemaName ?? "output_schema";
      body.response_format = this.convertZodToJsonSchema(options.schema, schemaName);
    }

    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": this.siteUrl,
        "X-Title": this.appName,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    const data = (await response.json()) as OpenRouterCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenRouterParseError("Missing content in OpenRouter response");
    }

    if (options.schema) {
      const parsed = this.parseStructuredOutput(options.schema, content);
      return {
        content: parsed,
        usage: data.usage,
        model: data.model ?? options.model,
      };
    }

    return {
      content,
      usage: data.usage,
      model: data.model ?? options.model,
    };
  }

  private convertZodToJsonSchema<T>(schema: ZodSchema<T>, name: string): object {
    const jsonSchema = zodToJsonSchema(schema, { name });
    const sanitizedSchema = this.enforceNoAdditionalProperties(jsonSchema);
    const rootSchema = this.unwrapRootSchema(sanitizedSchema, name);

    return {
      type: "json_schema",
      json_schema: {
        name,
        strict: true,
        schema: rootSchema,
      },
    };
  }

  private unwrapRootSchema(schema: unknown, name: string): unknown {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    const record = schema as Record<string, unknown>;
    const definitions = record.definitions as Record<string, unknown> | undefined;
    const root = (definitions?.[name] as Record<string, unknown> | undefined) ?? record;

    if (!("type" in root)) {
      root.type = "object";
    }

    return root;
  }

  private enforceNoAdditionalProperties(schema: unknown): unknown {
    const cloned = this.cloneSchema(schema);
    return this.applyAdditionalPropertiesFalse(cloned);
  }

  private cloneSchema<T>(schema: T): T {
    if (typeof structuredClone === "function") {
      return structuredClone(schema);
    }
    return JSON.parse(JSON.stringify(schema)) as T;
  }

  private applyAdditionalPropertiesFalse(schema: unknown): unknown {
    if (Array.isArray(schema)) {
      return schema.map((item) => this.applyAdditionalPropertiesFalse(item));
    }

    if (!schema || typeof schema !== "object") {
      return schema;
    }

    const record = schema as Record<string, unknown>;

    if (record.type === "object") {
      record.additionalProperties = false;
    }

    if (record.properties && typeof record.properties === "object") {
      Object.values(record.properties).forEach((value) => this.applyAdditionalPropertiesFalse(value));
    }

    if (record.items) {
      this.applyAdditionalPropertiesFalse(record.items);
    }

    ["anyOf", "allOf", "oneOf"].forEach((key) => {
      const items = record[key];
      if (Array.isArray(items)) {
        items.forEach((item) => this.applyAdditionalPropertiesFalse(item));
      }
    });

    if (record.definitions && typeof record.definitions === "object") {
      Object.values(record.definitions).forEach((value) => this.applyAdditionalPropertiesFalse(value));
    }

    return record;
  }

  private async handleApiError(response: Response): Promise<void> {
    const text = await response.text().catch(() => "");
    const parsed = this.safeParseJson(text);

    const fallbackMessage = text || `OpenRouter API error (${response.status})`;
    const parsedRecord = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    const errorRecord =
      parsedRecord && typeof parsedRecord.error === "object" ? (parsedRecord.error as Record<string, unknown>) : null;
    const messageFromError = typeof errorRecord?.message === "string" ? errorRecord.message : undefined;
    const messageFromRoot = typeof parsedRecord?.message === "string" ? parsedRecord.message : undefined;
    const codeFromError = typeof errorRecord?.code === "string" ? errorRecord.code : undefined;
    const codeFromRoot = typeof parsedRecord?.code === "string" ? parsedRecord.code : undefined;
    const message = messageFromError ?? messageFromRoot ?? fallbackMessage;
    const code = codeFromError ?? codeFromRoot;

    throw new OpenRouterApiError(response.status, message, code);
  }

  private parseStructuredOutput<T>(schema: ZodSchema<T>, content: string): T {
    const parsed = this.safeParseJson(content);

    if (!parsed) {
      throw new OpenRouterParseError("Failed to parse structured output JSON");
    }

    try {
      return schema.parse(parsed);
    } catch {
      throw new OpenRouterParseError("Structured output does not match schema");
    }
  }

  private safeParseJson(content: string): unknown | null {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private validateMessages(messages: Message[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new OpenRouterParseError("Messages must be a non-empty array");
    }

    let totalLength = 0;

    for (const message of messages) {
      if (!message.content || typeof message.content !== "string") {
        throw new OpenRouterParseError("Message content must be a non-empty string");
      }

      if (message.content.length > this.maxMessageLength) {
        throw new OpenRouterParseError("Message content exceeds allowed length");
      }

      totalLength += message.content.length;
    }

    if (totalLength > this.maxTotalLength) {
      throw new OpenRouterParseError("Total message length exceeds allowed limit");
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterTimeoutError("OpenRouter request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
