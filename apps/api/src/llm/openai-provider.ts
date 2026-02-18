import OpenAI from 'openai';
import type { z } from 'zod';
import type { LLMProvider, LLMResponse } from './provider.js';

function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
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
    additionalProperties: false,
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

export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze<T>(prompt: string, schema: z.ZodSchema<T>): Promise<LLMResponse<T>> {
    const client = new OpenAI({ apiKey: this.apiKey });
    const jsonSchema = zodToJsonSchema(schema);

    const start = Date.now();

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional stock analyst. Respond with structured JSON matching the provided schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'stock_analysis',
          strict: true,
          schema: jsonSchema,
        },
      },
    });

    const latencyMs = Date.now() - start;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const rawData = JSON.parse(content);
    const parsed = schema.parse(rawData);

    return {
      data: parsed,
      model: response.model,
      tokensUsed: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
      },
      latencyMs,
    };
  }
}
