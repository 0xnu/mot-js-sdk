import nock from "nock";
import MotApiSdk from "../src/mot-js-sdk";

describe("MotApiSdk", () => {
  const clientId = process.env.MOT_CLIENT_ID || "dummy-client-id";
  const clientSecret = process.env.MOT_CLIENT_SECRET || "dummy-client-secret";
  const apiKey = process.env.MOT_API_KEY || "dummy-api-key";
  const baseUrl = "https://history.mot.api.gov.uk/v1/trade/vehicles";
  const tokenUrl =
    "https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token";
  const scopeUrl = "https://tapi.dvsa.gov.uk/.default";

  let sdk: MotApiSdk;

  beforeEach(() => {
    sdk = new MotApiSdk(clientId, clientSecret, apiKey);
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Authentication", () => {
    it("should acquire a token successfully", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl)
        .get("/registration/TEST123")
        .reply(200, { registration: "TEST123" });

      const result = await sdk.getVehicleByRegistration("TEST123");
      expect(result).toEqual({ registration: "TEST123" });
    });

    it("should throw an error when token acquisition fails", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(400, { error: "invalid_client" });

      await expect(sdk.getVehicleByRegistration("TEST123")).rejects.toThrow(
        "Failed to obtain access token",
      );
    });
  });

  describe("getVehicleByRegistration", () => {
    it("should return vehicle data for a valid registration", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl)
        .get("/registration/ABC123")
        .reply(200, { registration: "ABC123", make: "Ford", model: "Focus" });

      const result = await sdk.getVehicleByRegistration("ABC123");
      expect(result).toEqual({
        registration: "ABC123",
        make: "Ford",
        model: "Focus",
      });
    });

    it("should throw an error for an invalid registration", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl)
        .get("/registration/INVALID")
        .reply(404, { errorCode: "MOTH-NP-01", errorMessage: "Not found" });

      await expect(sdk.getVehicleByRegistration("INVALID")).rejects.toThrow(
        "404: Not Found - The requested data is not found",
      );
    });
  });

  describe("getVehicleByVin", () => {
    it("should return vehicle data for a valid VIN", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).get("/vin/1HGBH41JXMN109186").reply(200, {
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Civic",
      });

      const result = await sdk.getVehicleByVin("1HGBH41JXMN109186");
      expect(result).toEqual({
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Civic",
      });
    });

    it("should throw an error for an invalid VIN", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).get("/vin/INVALID").reply(400, {
        errorCode: "MOTH-BAD-REQ-01",
        errorMessage: "Bad request",
      });

      await expect(sdk.getVehicleByVin("INVALID")).rejects.toThrow(
        "400: Bad Request - The format of the request is incorrect",
      );
    });
  });

  describe("getBulkDownload", () => {
    it("should return bulk download data", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).get("/bulk-download").reply(200, {
        bulkFile: "https://example.com/bulk.zip",
        lastUpdated: "2024-09-21",
      });

      const result = await sdk.getBulkDownload();
      expect(result).toEqual({
        bulkFile: "https://example.com/bulk.zip",
        lastUpdated: "2024-09-21",
      });
    });

    it("should throw an error when bulk download is unavailable", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).get("/bulk-download").reply(503, {
        errorCode: "MOTH-SERVICE-UNAVAILABLE",
        errorMessage: "Service unavailable",
      });

      await expect(sdk.getBulkDownload()).rejects.toThrow(
        "503: Service Unavailable - The server is currently unable to handle the request",
      );
    });
  });

  describe("renewCredentials", () => {
    it("should successfully renew credentials", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl)
        .put("/credentials")
        .reply(200, { clientSecret: "new-client-secret" });

      const result = await sdk.renewCredentials({
        awsApiKeyValue: "old-key",
        email: "test@example.com",
      });
      expect(result).toEqual({ clientSecret: "new-client-secret" });
    });

    it("should throw an error when credential renewal fails", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).put("/credentials").reply(412, {
        errorCode: "MOTH-PRECONDITION-FAILED",
        errorMessage: "Precondition failed",
      });

      await expect(
        sdk.renewCredentials({
          awsApiKeyValue: "invalid-key",
          email: "test@example.com",
        }),
      ).rejects.toThrow(
        "412: Precondition Failed - Could not complete request because a constraint was not met",
      );
    });
  });

  describe("Error handling", () => {
    it("should handle network errors", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl)
        .get("/registration/NETERROR")
        .replyWithError("Network error");

      await expect(sdk.getVehicleByRegistration("NETERROR")).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle rate limiting", async () => {
      nock(tokenUrl)
        .post("", (body) => body.scope === scopeUrl)
        .reply(200, { access_token: "test-token", expires_in: 3600 });

      nock(baseUrl).get("/registration/RATELIMIT").reply(429, {
        errorCode: "MOTH-RATE-LIMIT",
        errorMessage: "Too many requests",
      });

      await expect(sdk.getVehicleByRegistration("RATELIMIT")).rejects.toThrow(
        "429: Too Many Requests - The user has sent too many requests in a given amount of time",
      );
    });
  });
});
