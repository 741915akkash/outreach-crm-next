import { describe, expect, it } from 'vitest';

import { EventRegistry } from '@server/shared/events/registry/event-registry.js';
import { companyDeletedDefinition } from '@server/shared/events/contracts/crm-event-definitions.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';

describe('EventRegistry', () => {
  it('registers and retrieves an event definition', () => {
    const registry = new EventRegistry();

    registry.register(companyDeletedDefinition);

    expect(registry.get(EVENT_NAMES.COMPANY_DELETED, 1)).toBe(companyDeletedDefinition);
  });

  it('returns undefined for an unregistered event', () => {
    const registry = new EventRegistry();

    expect(registry.get(EVENT_NAMES.COMPANY_DELETED, 1)).toBeUndefined();
  });

  it('returns undefined for an unsupported event version', () => {
    const registry = new EventRegistry();

    registry.register(companyDeletedDefinition);

    expect(registry.get(EVENT_NAMES.COMPANY_DELETED, 2)).toBeUndefined();
  });

  it('rejects duplicate event name and version registrations', () => {
    const registry = new EventRegistry();

    registry.register(companyDeletedDefinition);

    expect(() => {
      registry.register(companyDeletedDefinition);
    }).toThrow('Event "crm.company.deleted" version 1 is already registered.');
  });

  it('validates a valid event payload', () => {
    const registry = new EventRegistry();

    registry.register(companyDeletedDefinition);

    const result = registry.validate(EVENT_NAMES.COMPANY_DELETED, 1, {
      id: 123,
      name: 'Acme Technologies',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid event payload', () => {
    const registry = new EventRegistry();

    registry.register(companyDeletedDefinition);

    const result = registry.validate(EVENT_NAMES.COMPANY_DELETED, 1, {
      id: 'invalid-id',
      name: 'Acme Technologies',
    });

    expect(result.success).toBe(false);
  });

  it('throws when validating an unregistered event version', () => {
    const registry = new EventRegistry();

    expect(() => {
      registry.validate(EVENT_NAMES.COMPANY_DELETED, 2, {
        id: 123,
        name: 'Acme Technologies',
      });
    }).toThrow('Event "crm.company.deleted" version 2 is not registered.');
  });
});
