import { CollabifyMdPage } from './app.po';

describe('collabify-md App', () => {
  let page: CollabifyMdPage;

  beforeEach(() => {
    page = new CollabifyMdPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
