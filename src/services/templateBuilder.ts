export interface DynamicParameter {
  key: string;
  value: string;
  label?: string;
}

// services/templateBuilder.ts

export interface TemplateConfig {
  name: string;
  requiredFields: string[];
  optionalFields: string[];
  fieldOrder: string[];
  allowedFields?: string[];  // ✅ Add this
}

export class TemplateBuilder {
  static buildWhatsAppComponents(parameters: Record<string, any>, config: TemplateConfig): Array<{
    type: string;
    parameters?: Array<{ type: string; text?: string; payload?: string }>;
    sub_type?: string;
    index?: number;
  }> {
    const components: Array<{
      type: string;
      parameters?: Array<{ type: string; text?: string; payload?: string }>;
      sub_type?: string;
      index?: number;
    }> = [];

    const bodyParams: Array<{ type: string; text: string }> = [];

    config.fieldOrder.forEach(field => {
      if (parameters[field] !== undefined && parameters[field] !== null && parameters[field] !== '') {
        bodyParams.push({
          type: 'text',
          text: String(parameters[field])
        });
      }
    });

    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams
      });
    }

    if (parameters.header && Array.isArray(parameters.header)) {
      components.unshift({
        type: 'header',
        parameters: parameters.header.map((param: string | { type: string; text?: string; payload?: string }) =>
          typeof param === 'string' ? { type: 'text', text: param } : param
        )
      });
    }

    if (parameters.buttons && Array.isArray(parameters.buttons)) {
      parameters.buttons.forEach((button: { type: string; text?: string; payload?: string; index?: number }, idx: number) => {
        if (button.type === 'quick_reply' || button.type === 'url') {
          components.push({
            type: 'button',
            sub_type: button.type,
            index: button.index !== undefined ? button.index : idx,
            parameters: button.payload ? [{ type: 'payload', payload: button.payload }] :
              button.text ? [{ type: 'text', text: button.text }] : []
          });
        }
      });
    }

    return components;
  }

  static buildEmailContent(template: string, parameters: Record<string, any>): string {
    let content = template;

    // List of all possible optional parameters
    const optionalParams = ['businessOverview', 'marketingProfitability', 'operationsCash', 'keySignals', 'revenue', 'expenses', 'profit', 'newCustomers', 'returns', 'loyaltyPoints'];

    // Track which parameters have values
    const paramsWithValues = new Set<string>();

    // First, identify which parameters have values
    optionalParams.forEach(key => {
      const paramValue = parameters[key];
      const hasValue = paramValue !== undefined && 
                      paramValue !== null && 
                      paramValue !== '' &&
                      String(paramValue).trim() !== '';
      if (hasValue) {
        paramsWithValues.add(key);
      }
    });

    // Remove sections for parameters that are NOT provided
    optionalParams.forEach(key => {
      if (!paramsWithValues.has(key)) {
        // Remove HTML conditional section - try different whitespace variations
        const htmlPatterns = [
          `<!-- IF:${key} -->`,
          `<!--IF:${key}-->`,
          `<!-- IF:${key}-->`,
          `<!--IF:${key} -->`
        ];
        
        const htmlEndPatterns = [
          `<!-- ENDIF:${key} -->`,
          `<!--ENDIF:${key}-->`,
          `<!-- ENDIF:${key}-->`,
          `<!--ENDIF:${key} -->`
        ];
        
        htmlPatterns.forEach((startMarker, idx) => {
          const endMarker = htmlEndPatterns[idx];
          let startIndex = content.indexOf(startMarker);
          
          while (startIndex !== -1) {
            const afterStart = content.substring(startIndex + startMarker.length);
            const endIndex = afterStart.indexOf(endMarker);
            
            if (endIndex !== -1) {
              const fullEndIndex = startIndex + startMarker.length + endIndex + endMarker.length;
              content = content.substring(0, startIndex) + content.substring(fullEndIndex);
              startIndex = content.indexOf(startMarker);
            } else {
              break;
            }
          }
        });

        // Remove text conditional section
        const textStartMarker = `{{#if ${key}}}`;
        const textEndMarker = `{{/if}}`;
        
        let startIndex = content.indexOf(textStartMarker);
        while (startIndex !== -1) {
          const afterStart = content.substring(startIndex + textStartMarker.length);
          const endIndex = afterStart.indexOf(textEndMarker);
          
          if (endIndex !== -1) {
            const fullEndIndex = startIndex + textStartMarker.length + endIndex + textEndMarker.length;
            content = content.substring(0, startIndex) + content.substring(fullEndIndex);
            startIndex = content.indexOf(textStartMarker);
          } else {
            break;
          }
        }
      }
    });

    // Replace parameter placeholders with actual values - process ALL parameters
    // First, replace all parameters that have values
    Object.keys(parameters).forEach(key => {
      const paramValue = parameters[key];
      if (paramValue !== undefined && paramValue !== null && paramValue !== '' && String(paramValue).trim() !== '') {
        const value = String(paramValue);
        
        // Replace with default fallback pattern (e.g., {{key || "default"}})
        const regex1 = new RegExp(`\\{\\{${key}\\s*\\|\\|\\s*"[^"]*"\\}\\}`, 'g');
        content = content.replace(regex1, value);
        
        // Replace simple pattern (e.g., {{key}}) - do this multiple times to catch all instances
        const regex2 = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        let replaced = content.replace(regex2, value);
        // Keep replacing until no more matches
        while (replaced !== content) {
          content = replaced;
          replaced = content.replace(regex2, value);
        }
        content = replaced;
      }
    });
    
    // Then handle parameters without values (use defaults or remove)
    optionalParams.forEach(key => {
      if (!paramsWithValues.has(key)) {
        const regex1 = new RegExp(`\\{\\{${key}\\s*\\|\\|\\s*"([^"]*)"\\}\\}`, 'g');
        const match = regex1.exec(content);
        if (match) {
          content = content.replace(regex1, match[1]);
        } else {
          const regex2 = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          content = content.replace(regex2, '');
        }
      }
    });

    // Clean up conditional markers - remove HTML comment markers for parameters that have values
    // (The content is already there, we just need to remove the <!-- IF:key --> and <!-- ENDIF:key --> markers)
    paramsWithValues.forEach(key => {
      // Remove HTML start markers
      content = content.replace(new RegExp(`<!--\\s*IF:${key}\\s*-->`, 'g'), '');
      // Remove HTML end markers  
      content = content.replace(new RegExp(`<!--\\s*ENDIF:${key}\\s*-->`, 'g'), '');
      // Remove text start markers
      content = content.replace(new RegExp(`\\{\\{#if\\s+${key}\\}\\}`, 'g'), '');
      // For text templates, we'll remove {{/if}} markers separately after processing all keys
    });

    // Clean up any remaining text {{/if}} markers (these are safe to remove globally since we've already processed all conditionals)
    // But only remove them if they're not part of a still-active conditional
    content = content.replace(/\{\{\/if\}\}/g, '');

    // Final fallback: unresolved placeholders should never leak in outgoing emails.
    content = content.replace(/\{\{\s*[\w.]+\s*\|\|[^}]+\}\}/g, '0.00');
    content = content.replace(/\{\{\s*[\w.]+\s*\}\}/g, '0.00');

    return content;
  }

  static validateParameters(parameters: Record<string, any>, config: TemplateConfig): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    config.requiredFields.forEach(field => {
      if (!parameters[field] || parameters[field] === '' || parameters[field] === null || parameters[field] === undefined) {
        missing.push(field);
      }
    });

    return {
      valid: missing.length === 0,
      missing 
    };
  }
}
