import { z } from 'zod';

import type {
  CompanyCreatedPayload,
  CompanyUpdatedPayload,
  CompanyDeletedPayload,
  LeadCreatedPayload,
  LeadUpdatedPayload,
  LeadDeletedPayload,
  DealCreatedPayload,
  DealUpdatedPayload,
  DealDeletedPayload,
  DealStageChangedPayload,
  TaskCreatedPayload,
  TaskUpdatedPayload,
  TaskDeletedPayload,
  TaskCompletedPayload,
} from './event-types.js';

export const companyCreatedPayloadSchema: z.ZodType<CompanyCreatedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const companyUpdatedPayloadSchema: z.ZodType<CompanyUpdatedPayload> = z.object({
  id: z.number().int(),
  changes: z.object({
    name: z.string().optional(),
    website: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

export const companyDeletedPayloadSchema: z.ZodType<CompanyDeletedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const leadCreatedPayloadSchema: z.ZodType<LeadCreatedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
  companyId: z.number().int().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  pipelineId: z.number().int().nullable(),
  stageId: z.number().int().nullable(),
  sourceId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const leadUpdatedPayloadSchema: z.ZodType<LeadUpdatedPayload> = z.object({
  id: z.number().int(),
  changes: z.object({
    name: z.string().optional(),
    companyId: z.number().int().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    pipelineId: z.number().int().nullable().optional(),
    stageId: z.number().int().nullable().optional(),
    sourceId: z.number().int().nullable().optional(),
  }),
});

export const leadDeletedPayloadSchema: z.ZodType<LeadDeletedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const dealCreatedPayloadSchema: z.ZodType<DealCreatedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
  companyId: z.number().int().nullable(),
  pipelineId: z.number().int(),
  stageId: z.number().int(),
  value: z.string().nullable(),
  currency: z.string().nullable(),
  expectedCloseDate: z.iso.datetime().nullable(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const dealUpdatedPayloadSchema: z.ZodType<DealUpdatedPayload> = z.object({
  id: z.number().int(),
  changes: z.object({
    name: z.string().optional(),
    companyId: z.number().int().nullable().optional(),
    pipelineId: z.number().int().optional(),
    stageId: z.number().int().optional(),
    value: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    expectedCloseDate: z.iso.datetime().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

export const dealDeletedPayloadSchema: z.ZodType<DealDeletedPayload> = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const dealStageChangedPayloadSchema: z.ZodType<DealStageChangedPayload> = z.object({
  id: z.number().int(),
  previousStageId: z.number().int(),
  newStageId: z.number().int(),
});

export const taskCreatedPayloadSchema: z.ZodType<TaskCreatedPayload> = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['P1', 'P2', 'P3']),
  dueDate: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  assignedToId: z.string(),
  createdById: z.string(),
  leadId: z.number().int().nullable(),
  dealId: z.number().int().nullable(),
  visibility: z.enum(['EVERYONE', 'PRIVATE']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const taskUpdatedPayloadSchema: z.ZodType<TaskUpdatedPayload> = z.object({
  id: z.number().int(),
  changes: z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['P1', 'P2', 'P3']).optional(),
    dueDate: z.iso.datetime().nullable().optional(),
    completedAt: z.iso.datetime().nullable().optional(),
    assignedToId: z.string().optional(),
    leadId: z.number().int().nullable().optional(),
    dealId: z.number().int().nullable().optional(),
    visibility: z.enum(['EVERYONE', 'PRIVATE']).optional(),
  }),
});

export const taskDeletedPayloadSchema: z.ZodType<TaskDeletedPayload> = z.object({
  id: z.number().int(),
  title: z.string(),
});

export const taskCompletedPayloadSchema: z.ZodType<TaskCompletedPayload> = z.object({
  id: z.number().int(),
  title: z.string(),
  completedAt: z.iso.datetime(),
});
