import { expect, type Locator, type Page } from "@playwright/test";

class AnalysisPage {
  readonly page: Page;
  readonly feature: Locator;
  readonly inputTextarea: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly tokenGrid: Locator;
  readonly tokenCards: Locator;
  readonly translationText: Locator;
  readonly toastTitle: Locator;
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feature = page.getByTestId("analysis-feature");
    this.inputTextarea = page.getByTestId("analysis-input-textarea");
    this.submitButton = page.getByTestId("analysis-submit-button");
    this.errorMessage = page.getByTestId("analysis-input-error");
    this.tokenGrid = page.getByTestId("analysis-token-grid");
    this.tokenCards = page.getByTestId("analysis-token-card");
    this.translationText = page.getByTestId("analysis-translation-text");
    this.toastTitle = page.getByTestId("toast-title");
    this.toastDescription = page.getByTestId("toast-description");
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.feature).toHaveAttribute("data-hydrated", "true");
  }

  async fillText(text: string) {
    await this.inputTextarea.fill(text);
    await expect(this.inputTextarea).toHaveValue(text);
  }

  async submit() {
    await this.submitButton.click();
  }

  async analyze(text: string) {
    await this.fillText(text);
    await this.submit();
  }
}

export { AnalysisPage };
