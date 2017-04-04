import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewAreaComponent } from './preview-area.component';

describe('PreviewAreaComponent', () => {
  let component: PreviewAreaComponent;
  let fixture: ComponentFixture<PreviewAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
