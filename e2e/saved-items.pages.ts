import { expect, type Locator, type Page } from "@playwright/test";

class SavedItemsPage {
  readonly page: Page;
  readonly feature: Locator;
  readonly header: Locator;
  readonly searchInput: Locator;
  readonly list: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feature = page.getByTestId("saved-items-feature");
    this.header = page.getByTestId("saved-items-header");
    this.searchInput = page.getByTestId("saved-items-search-input");
    this.list = page.getByTestId("saved-items-list");
    this.emptyState = page.getByTestId("saved-items-empty-state");
    this.loadingSkeleton = page.getByTestId("saved-items-skeleton");
  }

  async goto() {
    await this.page.goto("/saved");
    await expect(this.feature).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await expect(this.searchInput).toHaveValue(query);
  }

  async waitForResults() {
    await expect(this.loadingSkeleton).toHaveCount(0);
  }

  cardById(id: string) {
    return this.page.locator(`[data-testid="saved-item-card"][data-saved-item-id="${id}"]`);
  }
}

class SavedAnalysisPage {
  readonly page: Page;
  readonly feature: Locator;
  readonly view: Locator;
  readonly errorMessage: Locator;
  readonly tokenGrid: Locator;
  readonly translationText: Locator;
  readonly deleteButton: Locator;
  readonly copyButton: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feature = page.getByTestId("saved-analysis-feature");
    this.view = page.getByTestId("saved-analysis-view");
    this.errorMessage = page.getByTestId("saved-analysis-error-message");
    this.tokenGrid = page.getByTestId("analysis-token-grid");
    this.translationText = page.getByTestId("analysis-translation-text");
    this.deleteButton = page.getByTestId("saved-analysis-delete-button");
    this.copyButton = page.getByTestId("saved-analysis-copy-button");
    this.loadingSkeleton = page.getByTestId("saved-analysis-loading");
  }

  async goto(id: string) {
    await this.page.goto(`/analysis/${id}`);
    await expect(this.feature).toBeVisible();
  }

  async waitForLoaded() {
    await expect(this.loadingSkeleton).toHaveCount(0);
  }
}

export { SavedAnalysisPage, SavedItemsPage };
