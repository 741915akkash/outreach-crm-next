import type { z } from 'zod';

import type { EventName, EventPayloadMap } from '../contracts/event-types.js';

export interface EventDefinition<TName extends EventName = EventName> {
  name: EventName;
  version: number;
  description: string;
  payloadSchema: z.ZodType<EventPayloadMap[TName]>;
}

/**
 * Registry for managing supported domain event definitions.
 */
export class EventRegistry {
  private readonly definitions = new Map<string, EventDefinition>();

  register(definition: EventDefinition): void {
    const key = `${definition.name}:v${definition.version}`;

    if (this.definitions.has(key)) {
      throw new Error(`Event "${definition.name}" version ${definition.version} is already registered.`);
    }

    this.definitions.set(key, definition);
  }

  get(name: EventName, version: number): EventDefinition | undefined {
    const key = `${name}:v${version}`;

    return this.definitions.get(key);
  }

  validate(name: EventName, version: number, payload: unknown) {
    const definition = this.get(name, version);

    if (!definition) {
      throw new Error(`Event "${name}" version ${version} is not registered.`);
    }

    return definition.payloadSchema.safeParse(payload);
  }
}
