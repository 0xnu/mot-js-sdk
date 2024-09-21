import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import qs from "qs";
import { EventEmitter } from "events";

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface CredentialsRequest {
  awsApiKeyValue: string;
  email: string;
}

class MotApiSdk extends EventEmitter {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private static readonly BASE_URL =
    "https://history.mot.api.gov.uk/v1/trade/vehicles";
  private static readonly TOKEN_URL =
    "https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token";
  private static readonly SCOPE_URL = "https://tapi.dvsa.gov.uk/.default";

  private static readonly ERROR_MESSAGES: ReadonlyMap<number, string> = new Map(
    [
      [400, "Bad Request - The format of the request is incorrect"],
      [401, "Unauthorized - Authentication credentials are missing or invalid"],
      [403, "Forbidden - The request is not allowed"],
      [404, "Not Found - The requested data is not found"],
      [
        405,
        "Method Not Allowed - The HTTP method is not supported for this endpoint",
      ],
      [406, "Not Acceptable - The requested media type is not supported"],
      [
        409,
        "Conflict - The request could not be completed due to a conflict with the current state of the target resource",
      ],
      [
        412,
        "Precondition Failed - Could not complete request because a constraint was not met",
      ],
      [
        415,
        "Unsupported Media Type - The media type of the request is not supported",
      ],
      [
        422,
        "Unprocessable Entity - The request was well-formed but contains semantic errors",
      ],
      [
        429,
        "Too Many Requests - The user has sent too many requests in a given amount of time",
      ],
      [500, "Internal Server Error - An unexpected error has occurred"],
      [
        502,
        "Bad Gateway - The server received an invalid response from an upstream server",
      ],
      [
        503,
        "Service Unavailable - The server is currently unable to handle the request",
      ],
      [
        504,
        "Gateway Timeout - The upstream server failed to send a request in the time allowed by the server",
      ],
    ],
  );

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly apiKey: string,
  ) {
    super();
    this.axiosInstance = axios.create({
      baseURL: MotApiSdk.BASE_URL,
      headers: {
        "X-API-Key": this.apiKey,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        config.headers["Authorization"] = `Bearer ${await this.getToken()}`;
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error),
    );
  }

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    try {
      const params = qs.stringify({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: MotApiSdk.SCOPE_URL,
      });

      const tokenResponse = await axios.post<TokenResponse>(
        MotApiSdk.TOKEN_URL,
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.token = tokenResponse.data.access_token;
      this.tokenExpiry = Date.now() + tokenResponse.data.expires_in * 1000;

      this.emit("tokenRefreshed", { expiresAt: new Date(this.tokenExpiry) });

      return this.token;
    } catch (error) {
      this.emit("tokenError", error);
      throw new Error("Failed to obtain access token");
    }
  }

  private handleApiError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const message =
        MotApiSdk.ERROR_MESSAGES.get(status) || "An unknown error occurred";
      this.emit("apiError", { status, message });
      throw new Error(`${status}: ${message}`);
    }
    this.emit("networkError", error);
    throw error;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "PUT" = "GET",
    data?: any,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request({
        url: endpoint,
        method,
        data: method === "PUT" ? qs.stringify(data) : data,
        headers:
          method === "PUT"
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : {},
      });
      this.emit("requestSuccess", { endpoint, method });
      return response.data;
    } catch (error) {
      this.emit("requestError", { endpoint, method, error });
      throw error;
    }
  }

  async getVehicleByRegistration(registration: string): Promise<any> {
    return this.makeRequest(`/registration/${registration}`);
  }

  async getVehicleByVin(vin: string): Promise<any> {
    return this.makeRequest(`/vin/${vin}`);
  }

  async getBulkDownload(): Promise<any> {
    return this.makeRequest("/bulk-download");
  }

  async renewCredentials(credentials: CredentialsRequest): Promise<any> {
    return this.makeRequest("/credentials", "PUT", credentials);
  }
}

export default MotApiSdk;
