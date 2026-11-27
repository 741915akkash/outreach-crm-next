import type { EventEnvelope } from './event-envelope.js';

/**
 * Canonical event names used throughout the CRM.
 */
export const EVENT_NAMES = {
  LEAD_CREATED: 'crm.lead.created',
  LEAD_UPDATED: 'crm.lead.updated',
  LEAD_DELETED: 'crm.lead.deleted',

  COMPANY_CREATED: 'crm.company.created',
  COMPANY_UPDATED: 'crm.company.updated',
  COMPANY_DELETED: 'crm.company.deleted',

  DEAL_CREATED: 'crm.deal.created',
  DEAL_UPDATED: 'crm.deal.updated',
  DEAL_DELETED: 'crm.deal.deleted',
  DEAL_STAGE_CHANGED: 'crm.deal.stage_changed',

  TASK_CREATED: 'crm.task.created',
  TASK_UPDATED: 'crm.task.updated',
  TASK_DELETED: 'crm.task.deleted',
  TASK_COMPLETED: 'crm.task.completed',
} as const;

/**
 * Lead created event payload.
 */
export interface LeadCreatedPayload {
  id: number;
  name: string;
  companyId: number | null;
  email: string | null;
  phone: string | null;
  pipelineId: number | null;
  stageId: number | null;
  sourceId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lead updated event payload.
 */
export interface LeadUpdatedPayload {
  id: number;
  changes: {
    name?: string;
    companyId?: number | null;
    email?: string | null;
    phone?: string | null;
    pipelineId?: number | null;
    stageId?: number | null;
    sourceId?: number | null;
  };
}

/**
 * Lead deleted event payload.
 */
export interface LeadDeletedPayload {
  id: number;
  name: string;
}

/**
 * Company created event payload.
 * Contains a snapshot of the company at creation time.
 */
export interface CompanyCreatedPayload {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Company updated event payload.
 * Contains only the fields changed by the operation.
 */
export interface CompanyUpdatedPayload {
  id: number;
  changes: {
    name?: string;
    website?: string | null;
    industry?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    description?: string | null;
  };
}

/**
 * Company deleted event payload.
 * Contains identifying information about the deleted company.
 */
export interface CompanyDeletedPayload {
  id: number;
  name: string;
}

/**
 * Deal created event payload.
 */
export interface DealCreatedPayload {
  id: number;
  name: string;
  companyId: number | null;
  pipelineId: number;
  stageId: number;
  value: string | null;
  currency: string | null;
  expectedCloseDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Deal updated event payload.
 */
export interface DealUpdatedPayload {
  id: number;
  changes: {
    name?: string;
    companyId?: number | null;
    pipelineId?: number;
    stageId?: number;
    value?: string | null;
    currency?: string | null;
    expectedCloseDate?: string | null;
    description?: string | null;
  };
}

/**
 * Deal deleted event payload.
 */
export interface DealDeletedPayload {
  id: number;
  name: string;
}

/**
 * Deal stage changed event payload.
 */
export interface DealStageChangedPayload {
  id: number;
  previousStageId: number;
  newStageId: number;
}

/**
 * Task created event payload.
 */
export interface TaskCreatedPayload {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'P1' | 'P2' | 'P3';
  dueDate: string | null;
  completedAt: string | null;
  assignedToId: string;
  createdById: string;
  leadId: number | null;
  dealId: number | null;
  visibility: 'EVERYONE' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

/**
 * Task updated event payload.
 */
export interface TaskUpdatedPayload {
  id: number;
  changes: {
    title?: string;
    description?: string | null;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority?: 'P1' | 'P2' | 'P3';
    dueDate?: string | null;
    completedAt?: string | null;
    assignedToId?: string;
    leadId?: number | null;
    dealId?: number | null;
    visibility?: 'EVERYONE' | 'PRIVATE';
  };
}

/**
 * Task deleted event payload.
 */
export interface TaskDeletedPayload {
  id: number;
  title: string;
}

/**
 * Task completed event payload.
 */
export interface TaskCompletedPayload {
  id: number;
  title: string;
  completedAt: string;
}

/**
 * Maps each event name to its corresponding payload type.
 */
export interface EventPayloadMap {
  [EVENT_NAMES.COMPANY_CREATED]: CompanyCreatedPayload;
  [EVENT_NAMES.COMPANY_UPDATED]: CompanyUpdatedPayload;
  [EVENT_NAMES.COMPANY_DELETED]: CompanyDeletedPayload;

  [EVENT_NAMES.LEAD_CREATED]: LeadCreatedPayload;
  [EVENT_NAMES.LEAD_UPDATED]: LeadUpdatedPayload;
  [EVENT_NAMES.LEAD_DELETED]: LeadDeletedPayload;

  [EVENT_NAMES.DEAL_CREATED]: DealCreatedPayload;
  [EVENT_NAMES.DEAL_UPDATED]: DealUpdatedPayload;
  [EVENT_NAMES.DEAL_DELETED]: DealDeletedPayload;
  [EVENT_NAMES.DEAL_STAGE_CHANGED]: DealStageChangedPayload;

  [EVENT_NAMES.TASK_CREATED]: TaskCreatedPayload;
  [EVENT_NAMES.TASK_UPDATED]: TaskUpdatedPayload;
  [EVENT_NAMES.TASK_DELETED]: TaskDeletedPayload;
  [EVENT_NAMES.TASK_COMPLETED]: TaskCompletedPayload;
}

/**
 * Union of all registered event names.
 */
export type EventName = keyof EventPayloadMap;

/**
 * Creates a strongly typed event from its event name.
 */
export type DomainEvent<TName extends EventName> = EventEnvelope<EventPayloadMap[TName]> & {
  eventName: TName;
};
