import { expect, test } from "@playwright/test";

import { Header, LoginPage } from "./auth.pages";
import { AnalysisPage } from "./analysis.pages";
import { SavedAnalysisPage, SavedItemsPage } from "./saved-items.pages";

const baseURL = "http://localhost:3000";

test.use({ baseURL });

const existingUserEmail = process.env.E2E_USERNAME ?? "";
const existingUserPassword = process.env.E2E_PASSWORD ?? "";

function assertE2ECredentials() {
  if (!existingUserEmail || !existingUserPassword) {
    throw new Error("Missing E2E_USERNAME or E2E_PASSWORD in environment.");
  }
}

const sampleAnalysis = {
  id: "analysis-123",
  originalText: "今日はいい天気です。",
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
    ],
  },
};

const sampleSavedItem = {
  savedItemId: "saved-123",
  savedAt: "2024-01-02T12:00:00.000Z",
  analysis: sampleAnalysis,
};

test.describe("Zarządzanie Zbiorem (Library)", () => {
  test.beforeEach(async ({ page }) => {
    assertE2ECredentials();
    const loginPage = new LoginPage(page);
    const header = new Header(page);

    await loginPage.goto();
    await loginPage.login(existingUserEmail, existingUserPassword);
    await expect(header.logoutButton).toBeVisible();
  });

  test('TC-09 Zapisanie analizy -> Analiza pojawia się w "Moje Zdania"', async ({ page }) => {
    const analysisPage = new AnalysisPage(page);
    const savedItemsPage = new SavedItemsPage(page);
    const header = new Header(page);
    const sampleText = sampleAnalysis.originalText;

    await page.route("**/api/analyses", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          analysis: sampleAnalysis,
          deduplicated: false,
        }),
      });
    });

    await page.route("**/api/saved-items**", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            savedItem: {
              id: sampleSavedItem.savedItemId,
              analysisId: sampleAnalysis.id,
              userId: "user-1",
              savedAt: sampleSavedItem.savedAt,
            },
          }),
        });
        return;
      }

      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [sampleSavedItem],
            page: 1,
            pageSize: 20,
            total: 1,
          }),
        });
        return;
      }

      await route.continue();
    });

    await analysisPage.goto();
    await analysisPage.analyze(sampleText);
    await expect(analysisPage.tokenGrid).toBeVisible();

    await analysisPage.saveButton.click();
    await expect(analysisPage.saveButton).toHaveText(/Zapisano|Zapisywanie/);

    await header.savedLink.click();
    await expect(savedItemsPage.feature).toBeVisible();

    const savedCard = savedItemsPage.cardById(sampleSavedItem.savedItemId);
    await expect(savedCard).toBeVisible();
    await expect(savedCard.getByTestId("saved-item-original-text")).toContainText(sampleText);
  });

  test("TC-10 Próba odczytu cudzych analiz -> Blokada przez RLS", async ({ page }) => {
    const savedAnalysisPage = new SavedAnalysisPage(page);
    const foreignAnalysisId = process.env.E2E_FOREIGN_ANALYSIS_ID ?? "00000000-0000-0000-0000-000000000000";

    await page.route(`**/api/analyses/${foreignAnalysisId}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });

    await savedAnalysisPage.goto(foreignAnalysisId);
    await savedAnalysisPage.waitForLoaded();
    await expect(savedAnalysisPage.errorMessage).toBeVisible();
    await expect(savedAnalysisPage.errorMessage).toContainText("Analiza nie została znaleziona");
  });

  test("TC-11 Wyszukiwanie w zapisanych zdaniach -> Filtrowanie listy po frazie japońskiej lub angielskiej", async ({
    page,
  }) => {
    const savedItemsPage = new SavedItemsPage(page);
    const matchingItem = sampleSavedItem;
    const otherItem = {
      savedItemId: "saved-456",
      savedAt: "2024-01-03T12:00:00.000Z",
      analysis: {
        ...sampleAnalysis,
        id: "analysis-456",
        originalText: "明日は雨です。",
        translation: "Jutro będzie deszcz.",
      },
    };

    await page.route("**/api/saved-items**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.continue();
        return;
      }

      const url = new URL(request.url());
      const query = url.searchParams.get("q")?.toLowerCase() ?? "";
      const allItems = [matchingItem, otherItem];
      const filtered = query
        ? allItems.filter((item) => {
            const original = item.analysis.originalText.toLowerCase();
            const translation = (item.analysis.translation ?? "").toLowerCase();
            return original.includes(query) || translation.includes(query);
          })
        : allItems;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: filtered,
          page: 1,
          pageSize: 20,
          total: filtered.length,
        }),
      });
    });

    await savedItemsPage.goto();
    await savedItemsPage.waitForResults();

    await savedItemsPage.search("天気");
    await page.waitForResponse((response) => {
      if (!response.url().includes("/api/saved-items") || response.status() !== 200) return false;
      const query = new URL(response.url()).searchParams.get("q");
      return query === "天気";
    });
    await savedItemsPage.waitForResults();
    await expect(savedItemsPage.cardById(matchingItem.savedItemId)).toBeVisible();
    await expect(savedItemsPage.cardById(otherItem.savedItemId)).toHaveCount(0);

    await savedItemsPage.search("deszcz");
    await page.waitForResponse((response) => {
      if (!response.url().includes("/api/saved-items") || response.status() !== 200) return false;
      const query = new URL(response.url()).searchParams.get("q");
      return query === "deszcz";
    });
    await savedItemsPage.waitForResults();
    await expect(savedItemsPage.cardById(otherItem.savedItemId)).toBeVisible();
  });

  test("TC-12 Kliknięcie na zapisaną analizę -> Widok szczegółów analizy", async ({ page }) => {
    const savedItemsPage = new SavedItemsPage(page);
    const savedAnalysisPage = new SavedAnalysisPage(page);

    await page.route("**/api/saved-items**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [sampleSavedItem],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      });
    });

    await page.route(`**/api/analyses/${sampleAnalysis.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ analysis: sampleAnalysis, savedItemId: sampleSavedItem.savedItemId }),
      });
    });

    await savedItemsPage.goto();
    await savedItemsPage.waitForResults();
    const savedCard = savedItemsPage.cardById(sampleSavedItem.savedItemId);
    await expect(savedCard).toBeVisible();

    await savedCard.click();
    await expect(savedAnalysisPage.view).toBeVisible();
    await expect(savedAnalysisPage.translationText).toContainText(sampleAnalysis.translation ?? "");
    await expect(savedAnalysisPage.tokenGrid).toBeVisible();
  });
});
