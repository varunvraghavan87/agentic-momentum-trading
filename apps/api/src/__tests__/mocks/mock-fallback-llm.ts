import type { FallbackLLMChain } from '../../agents/analyst-agent.js';

/**
 * Mock implementation of the FallbackLLMChain interface used by AnalystAgent.
 * Returns pre-configured JSON responses and tracks calls for assertions.
 */
export class MockFallbackLLM implements FallbackLLMChain {
  calls: { prompt: string }[] = [];
  private responseJson: string;

  constructor(responseData: unknown) {
    this.responseJson = JSON.stringify(responseData);
  }

  async generate(prompt: string): Promise<string> {
    this.calls.push({ prompt });
    return this.responseJson;
  }

  setResponse(data: unknown): void {
    this.responseJson = JSON.stringify(data);
  }

  reset(): void {
    this.calls = [];
  }
}
