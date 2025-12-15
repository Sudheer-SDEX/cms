import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallTracker } from './call-tracker';

describe('CallTracker', () => {
  let component: CallTracker;
  let fixture: ComponentFixture<CallTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
