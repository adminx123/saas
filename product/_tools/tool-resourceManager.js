// tool-resourceManager.js - Resource management tool for KV/R2 operations via client workers

import { Tool } from '@langchain/core/tools';

export const toolResourceManager = (env) => new Tool({
  name: 'resourceManager',
  description: 'Manage client-specific resources (KV storage, R2 images) by proxying through client workers. Input format: JSON string with {action: "kv_get|kv_put|kv_delete|r2_put|r2_get", key: "key_name", value?: "data", clientId: "client_id"}',
  func: async (input) => {
    try {
      const params = JSON.parse(input);
      const { action, key, value, clientId } = params;

      // Map clientId to service binding
      const clientBindings = {
        'inexasli': env.CLIENT_INEXASLI,
        'clientA': env.CLIENT_A,
        // Add more as needed
      };

      const binding = clientBindings[clientId];
      if (!binding) {
        return `Error: No binding for client ${clientId}`;
      }

      // Prepare request to client worker
      const resourceRequest = new Request(`https://dummy/resource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, key, value }),
      });

      // Call client worker
      const response = await binding.fetch(resourceRequest);
      const result = await response.text();

      return `Resource ${action} result: ${result}`;
    } catch (error) {
      return `Error in resource management: ${error.message}`;
    }
  },
});