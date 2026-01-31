import type { Locator, Page } from "@playwright/test";

class Header {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly logoutButton: Locator;
  readonly savedLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByTestId("nav-login-link");
    this.registerLink = page.getByTestId("nav-register-link");
    this.logoutButton = page.getByTestId("nav-logout-button");
    this.savedLink = page.getByTestId("nav-saved-link");
  }

  async logout() {
    await this.logoutButton.click();
  }
}

class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly form: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.form = page.getByTestId("login-form");
    this.formError = page.getByTestId("login-form-error");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmInput: Locator;
  readonly submitButton: Locator;
  readonly form: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("register-email-input");
    this.passwordInput = page.getByTestId("register-password-input");
    this.passwordConfirmInput = page.getByTestId("register-password-confirm-input");
    this.submitButton = page.getByTestId("register-submit-button");
    this.form = page.getByTestId("register-form");
    this.formError = page.getByTestId("register-form-error");
  }

  async goto() {
    await this.page.goto("/register");
  }

  async register(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordConfirmInput.fill(password);
    await this.submitButton.click();
  }
}

export { Header, LoginPage, RegisterPage };
