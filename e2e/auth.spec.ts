import { expect, test } from "@playwright/test";
import { Header, LoginPage, RegisterPage } from "./auth.pages";

const baseURL = "http://localhost:3000";

test.use({ baseURL });

const existingUserEmail = process.env.E2E_USERNAME ?? "";
const existingUserPassword = process.env.E2E_PASSWORD ?? "";
const defaultPassword = "Test1234";

function assertE2ECredentials() {
  if (!existingUserEmail || !existingUserPassword) {
    throw new Error("Missing E2E_USERNAME or E2E_PASSWORD in environment.");
  }
}

test.describe("Auth and account management", () => {
  test("TC-04 Rejestracja nowego użytkownika -> auto-login", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const header = new Header(page);
    const uniqueEmail = `mgregula+wakaru-${Date.now()}@gmail.com`;

    await registerPage.goto();
    await registerPage.register(uniqueEmail, defaultPassword);

    await expect(header.logoutButton).toBeVisible();
    await expect(header.savedLink).toBeVisible();
  });

  test("TC-05 Rejestracja na istniejący email -> błąd walidacji", async ({ page }) => {
    assertE2ECredentials();
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(existingUserEmail, defaultPassword);

    await expect(registerPage.formError).toBeVisible();
    await expect(registerPage.formError).toContainText("już istnieje");
  });

  test("TC-06 Logowanie i wylogowanie -> poprawna sesja", async ({ page }) => {
    assertE2ECredentials();
    const loginPage = new LoginPage(page);
    const header = new Header(page);

    await loginPage.goto();
    await loginPage.login(existingUserEmail, existingUserPassword);

    await expect(header.logoutButton).toBeVisible();
    await header.logout();
    await expect(loginPage.form).toBeVisible();
  });

  test("TC-07 Dostęp do /api/saved-items bez logowania -> 401/403", async ({ request }) => {
    const response = await request.get("/api/saved-items");

    expect([401, 403]).toContain(response.status());

    if (response.status() === 401) {
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    }
  });
});
