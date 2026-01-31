import { expect, test } from "./fixtures/coverage";

import { Header, LoginPage } from "./auth.pages";
import { AnalysisPage } from "./analysis.pages";

const baseURL = "http://localhost:3000";

test.use({ baseURL });

const existingUserEmail = process.env.E2E_USERNAME ?? "";
const existingUserPassword = process.env.E2E_PASSWORD ?? "";

function assertE2ECredentials() {
  if (!existingUserEmail || !existingUserPassword) {
    throw new Error("Missing E2E_USERNAME or E2E_PASSWORD in environment.");
  }
}

test.describe("Analiza tekstu (core)", () => {
  test.beforeEach(async ({ page }) => {
    assertE2ECredentials();
    const loginPage = new LoginPage(page);
    const header = new Header(page);

    await loginPage.goto();
    await loginPage.login(existingUserEmail, existingUserPassword);
    await expect(header.logoutButton).toBeVisible();
  });

  test("TC-01 Użytkownik wysyła poprawny tekst japoński -> otrzymuje kafelki i tłumaczenie", async ({ page }) => {
    const analysisPage = new AnalysisPage(page);
    const sampleText = "今日はいい天気です。";

    await page.route("**/api/analyses", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }

      const payload = request.postDataJSON() as { originalText?: string } | null;
      expect(payload?.originalText).toBe(sampleText);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          analysis: {
            id: "analysis-1",
            originalText: sampleText,
            translation: "Dzisiaj jest ładna pogoda.",
            createdAt: "2024-01-01T12:00:00.000Z",
            data: {
              difficulty: "N5",
              romaji: "Kyou wa ii tenki desu.",
              tokens: [
                {
                  surface: "今日",
                  dictionaryForm: "今日",
                  pos: "Noun",
                  reading: "きょう",
                  definition: "dziś",
                },
                {
                  surface: "は",
                  dictionaryForm: null,
                  pos: "Particle",
                  reading: "は",
                  definition: "partykuła tematu",
                },
                {
                  surface: "天気",
                  dictionaryForm: "天気",
                  pos: "Noun",
                  reading: "てんき",
                  definition: "pogoda",
                },
              ],
            },
          },
          deduplicated: false,
        }),
      });
    });

    await analysisPage.goto();
    await analysisPage.analyze(sampleText);

    await expect(analysisPage.tokenGrid).toBeVisible();
    await expect(analysisPage.tokenCards).toHaveCount(3);
    await expect(analysisPage.translationText).toContainText("Dzisiaj jest ładna pogoda.");
  });

  test("TC-02 Użytkownik wysyła tekst nie-japoński -> błąd walidacji", async ({ page }) => {
    const analysisPage = new AnalysisPage(page);

    await analysisPage.goto();
    await analysisPage.analyze("This is not Japanese text.");

    await expect(analysisPage.errorMessage).toBeVisible();
    await expect(analysisPage.errorMessage).toContainText("Wprowadź tekst zawierający znaki japońskie.");
  });

  test("TC-03 Przekroczenie limitu znaków (280) -> blokada wysyłki", async ({ page }) => {
    const analysisPage = new AnalysisPage(page);
    const overLimitText = "あ".repeat(281);

    await analysisPage.goto();
    await analysisPage.fillText(overLimitText);

    await expect(analysisPage.errorMessage).toBeVisible();
    await expect(analysisPage.errorMessage).toContainText("Tekst jest za długi (max 280 znaków).");
    await expect(analysisPage.submitButton).toBeDisabled();
  });
});
