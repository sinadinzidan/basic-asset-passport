import { CogniteError } from '@cognite/sdk';
import { describe, expect, it } from 'vitest';

import { getErrorReason } from '../errorReason';

describe(getErrorReason.name, () => {
  it('is the message of an error', () => {
    const error = new Error('The Asset_Passport data model was not found in sp-asset-passport.');

    expect(getErrorReason(error)).toBe(
      'The Asset_Passport data model was not found in sp-asset-passport.',
    );
  });

  it('is what CDF said with the HTTP status, without the request details the SDK adds', () => {
    const error = new CogniteError('Insufficient access rights.', 403, 'request-1');

    expect(getErrorReason(error)).toBe('Insufficient access rights. (HTTP 403)');
  });

  it('adds the HTTP status of an error that has one', () => {
    const error = Object.assign(new Error('Bad gateway'), { status: 502 });

    expect(getErrorReason(error)).toBe('Bad gateway (HTTP 502)');
  });

  it('reads a rejection that is not an Error but says what CDF said', () => {
    expect(getErrorReason({ errorMessage: 'Not found', status: 404 })).toBe('Not found (HTTP 404)');
  });

  it.each([
    ['an error without a message', new Error('')],
    ['an error with a blank message', new Error('   ')],
    ['text', 'failed'],
    ['a status alone', { status: 500 }],
    ['null', null],
    ['undefined', undefined],
  ])('has no reason for %s', (_case, error) => {
    expect(getErrorReason(error)).toBeNull();
  });
});
