import { SceneTemplateFactory, SceneTemplate } from './templates.types';

export interface TemplateFilterOptions {
  category?: string;
}

class TemplateRegistry {
  private factories = new Map<string, SceneTemplateFactory>();

  public register(id: string, factory: SceneTemplateFactory): void {
    this.factories.set(id, factory);
  }

  /**
   * Retrieves a template definition. The underlying factory is called with no config
   * to provide the default structural shape (useful for discovery/listing).
   */
  public getTemplate(id: string): SceneTemplate | undefined {
    const factory = this.factories.get(id);
    if (!factory) return undefined;
    
    // We instantiate without config to return the default shape
    return factory(); 
  }

  /**
   * Retrieves the underlying factory, which is required to build dynamic slots
   * based on the `config` payload provided during instantiation.
   */
  public getFactory(id: string): SceneTemplateFactory | undefined {
    return this.factories.get(id);
  }

  public listTemplates(options?: TemplateFilterOptions): SceneTemplate[] {
    const templates: SceneTemplate[] = [];
    
    for (const factory of this.factories.values()) {
      const template = factory();
      
      if (options?.category && template.category !== options.category) {
        continue;
      }
      
      templates.push(template);
    }
    
    // Return sorted alphabetically for determinism
    return templates.sort((a, b) => a.id.localeCompare(b.id));
  }

  public clear(): void {
    this.factories.clear();
  }
}

export const templateRegistry = new TemplateRegistry();

export function registerTemplate(id: string, factory: SceneTemplateFactory) {
  templateRegistry.register(id, factory);
}

export function getTemplate(id: string) {
  return templateRegistry.getTemplate(id);
}

export function listTemplates(options?: TemplateFilterOptions) {
  return templateRegistry.listTemplates(options);
}
