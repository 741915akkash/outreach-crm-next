import { EventRegistry } from './event-registry.js';

import {
  companyCreatedDefinition,
  companyDeletedDefinition,
  companyUpdatedDefinition,
  leadCreatedDefinition,
  leadDeletedDefinition,
  leadUpdatedDefinition,
  dealCreatedDefinition,
  dealDeletedDefinition,
  dealUpdatedDefinition,
  dealStageChangedDefinition,
  taskCreatedDefinition,
  taskDeletedDefinition,
  taskUpdatedDefinition,
  taskCompletedDefinition,
} from '../contracts/crm-event-definitions.js';

/**
 * Creates and configures the application event registry.
 */
function createEventRegistry(): EventRegistry {
  const registry = new EventRegistry();

  registry.register(companyCreatedDefinition);
  registry.register(companyUpdatedDefinition);
  registry.register(companyDeletedDefinition);

  registry.register(leadCreatedDefinition);
  registry.register(leadUpdatedDefinition);
  registry.register(leadDeletedDefinition);

  registry.register(dealCreatedDefinition);
  registry.register(dealUpdatedDefinition);
  registry.register(dealDeletedDefinition);
  registry.register(dealStageChangedDefinition);

  registry.register(taskCreatedDefinition);
  registry.register(taskUpdatedDefinition);
  registry.register(taskDeletedDefinition);
  registry.register(taskCompletedDefinition);

  return registry;
}

export const eventRegistry = createEventRegistry();
