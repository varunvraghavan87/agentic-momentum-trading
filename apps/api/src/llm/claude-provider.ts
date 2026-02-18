import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import type { LLMProvider, LLMResponse } from './provider';

function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  const def = (schema as z.ZodObject<z.ZodRawShape>)._def;
  const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;

  if (!shape) {
    return { type: 'object' };
  }

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const field = fieldSchema as z.ZodTypeAny;
    properties[key] = zodFieldToJsonSchema(field);

    if (!field.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: 'object' as const,
    properties,
    required,
  };
}

function zodFieldToJsonSchema(field: z.ZodTypeAny): Record<string, unknown> {
  const def = field._def;
  const typeName = def.typeName as string;

  switch (typeName) {
    case 'ZodString':
      return { type: 'string' };

    case 'ZodNumber': {
      const result: Record<string, unknown> = { type: 'number' };
      if (def.checks) {
        for (const check of def.checks as Array<{ kind: string; value: number }>) {
          if (check.kind === 'min') result.minimum = check.value;
          if (check.kind === 'max') result.maximum = check.value;
        }
      }
      return result;
    }

    case 'ZodEnum':
      return { type: 'string', enum: def.values };

    case 'ZodArray':
      return {
        type: 'array',
        items: zodFieldToJsonSchema(def.type),
      };

    case 'ZodObject':
      return zodToJsonSchema(field);

    default:
      return { type: 'string' };
  }
}

export class ClaudeProvider implements LLMProvider {
  public readonly name = 'claude';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze<T>(prompt: string, schema: z.ZodSchema<T>): Promise<LLMResponse<T>> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const inputSchema = zodToJsonSchema(schema);

    const start = Date.now();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      tools: [
        {
          name: 'stock_analysis',
          description:
            'Provide structured stock analysis output based on the screener candidates.',
          input_schema: inputSchema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool' as const, name: 'stock_analysis' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const latencyMs = Date.now() - start;

    const toolBlock = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
    );

    if (!toolBlock) {
      throw new Error('Claude did not return a tool_use response');
    }

    const parsed = schema.parse(toolBlock.input);

    return {
      data: parsed,
      model: response.model,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      latencyMs,
    };
  }
}
