import { EVENT_NAMES } from './event-types.js';

import {
  companyCreatedPayloadSchema,
  companyUpdatedPayloadSchema,
  companyDeletedPayloadSchema,
  leadCreatedPayloadSchema,
  leadUpdatedPayloadSchema,
  leadDeletedPayloadSchema,
  dealCreatedPayloadSchema,
  dealUpdatedPayloadSchema,
  dealDeletedPayloadSchema,
  dealStageChangedPayloadSchema,
  taskCreatedPayloadSchema,
  taskUpdatedPayloadSchema,
  taskDeletedPayloadSchema,
  taskCompletedPayloadSchema,
} from './crm-event-schemas.js';

import type { EventDefinition } from '../registry/event-registry.js';

export const companyCreatedDefinition = {
  name: EVENT_NAMES.COMPANY_CREATED,
  version: 1,
  description: 'Emitted when a company is created.',
  payloadSchema: companyCreatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.COMPANY_CREATED>;

export const companyUpdatedDefinition = {
  name: EVENT_NAMES.COMPANY_UPDATED,
  version: 1,
  description: 'Emitted when a company is updated.',
  payloadSchema: companyUpdatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.COMPANY_UPDATED>;

export const companyDeletedDefinition = {
  name: EVENT_NAMES.COMPANY_DELETED,
  version: 1,
  description: 'Emitted when a company is deleted.',
  payloadSchema: companyDeletedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.COMPANY_DELETED>;

export const leadCreatedDefinition = {
  name: EVENT_NAMES.LEAD_CREATED,
  version: 1,
  description: 'Emitted when a lead is created.',
  payloadSchema: leadCreatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.LEAD_CREATED>;

export const leadUpdatedDefinition = {
  name: EVENT_NAMES.LEAD_UPDATED,
  version: 1,
  description: 'Emitted when a lead is updated.',
  payloadSchema: leadUpdatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.LEAD_UPDATED>;

export const leadDeletedDefinition = {
  name: EVENT_NAMES.LEAD_DELETED,
  version: 1,
  description: 'Emitted when a lead is deleted.',
  payloadSchema: leadDeletedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.LEAD_DELETED>;

export const dealCreatedDefinition = {
  name: EVENT_NAMES.DEAL_CREATED,
  version: 1,
  description: 'Emitted when a deal is created.',
  payloadSchema: dealCreatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.DEAL_CREATED>;

export const dealUpdatedDefinition = {
  name: EVENT_NAMES.DEAL_UPDATED,
  version: 1,
  description: 'Emitted when a deal is updated.',
  payloadSchema: dealUpdatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.DEAL_UPDATED>;

export const dealDeletedDefinition = {
  name: EVENT_NAMES.DEAL_DELETED,
  version: 1,
  description: 'Emitted when a deal is deleted.',
  payloadSchema: dealDeletedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.DEAL_DELETED>;

export const dealStageChangedDefinition = {
  name: EVENT_NAMES.DEAL_STAGE_CHANGED,
  version: 1,
  description: 'Emitted when a deal moves to a different pipeline stage.',
  payloadSchema: dealStageChangedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.DEAL_STAGE_CHANGED>;

export const taskCreatedDefinition = {
  name: EVENT_NAMES.TASK_CREATED,
  version: 1,
  description: 'Emitted when a task is created.',
  payloadSchema: taskCreatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.TASK_CREATED>;

export const taskUpdatedDefinition = {
  name: EVENT_NAMES.TASK_UPDATED,
  version: 1,
  description: 'Emitted when a task is updated.',
  payloadSchema: taskUpdatedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.TASK_UPDATED>;

export const taskDeletedDefinition = {
  name: EVENT_NAMES.TASK_DELETED,
  version: 1,
  description: 'Emitted when a task is deleted.',
  payloadSchema: taskDeletedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.TASK_DELETED>;

export const taskCompletedDefinition = {
  name: EVENT_NAMES.TASK_COMPLETED,
  version: 1,
  description: 'Emitted when a task is completed.',
  payloadSchema: taskCompletedPayloadSchema,
} satisfies EventDefinition<typeof EVENT_NAMES.TASK_COMPLETED>;
