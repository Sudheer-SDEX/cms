import { TestBed } from '@angular/core/testing';

import { CallLog } from './call-log';

describe('CallLog', () => {
  let service: CallLog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallLog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
