import { describe, expect, test } from 'vitest';
import {
  ATTACHMENT_REORDER_ERROR,
  validateAttachmentReorder,
} from './validateAttachmentReorder';

describe('validateAttachmentReorder', () => {
  test('accepts matching id sets', () => {
    expect(() =>
      validateAttachmentReorder({
        orderedIds: ['b', 'a', 'c'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).not.toThrow();
  });

  test('rejects ids missing from payload', () => {
    expect(() =>
      validateAttachmentReorder({
        orderedIds: ['a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ATTACHMENT_REORDER_ERROR);
  });

  test('rejects duplicate ids in payload', () => {
    expect(() =>
      validateAttachmentReorder({
        orderedIds: ['a', 'a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ATTACHMENT_REORDER_ERROR);
  });

  test('rejects unknown ids in payload', () => {
    expect(() =>
      validateAttachmentReorder({
        orderedIds: ['a', 'b', 'x'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ATTACHMENT_REORDER_ERROR);
  });
});
