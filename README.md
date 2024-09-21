![GitHub top language](https://img.shields.io/github/languages/top/0xnu/mot-js-sdk)
![Snyk Vulnerabilities for npm scoped package](https://img.shields.io/snyk/vulnerabilities/npm/mot-js-sdk)
![GitHub package.json version](https://img.shields.io/github/package-json/v/0xnu/mot-js-sdk) <br>
![GitHub last commit](https://img.shields.io/github/last-commit/0xnu/mot-js-sdk)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/mot-js-sdk)
![npm](https://img.shields.io/npm/dw/mot-js-sdk) <br>
![GitHub issues](https://img.shields.io/github/issues-raw/0xnu/mot-js-sdk)
![License](https://img.shields.io/github/license/0xnu/mot-js-sdk)

## MOT History API JS SDK

A [TypeScript](https://www.typescriptlang.org/) SDK for the MOT History API.

### Build

To build the package, execute the following command:

```bash
npm run build
```

### Testing

Developers/Engineers can test the SDK with or without client credentials.

a. The test uses environment variables with fallback values if you test without credentials:

```js
const clientId = process.env.MOT_CLIENT_ID || "dummy-client-id";
const clientSecret = process.env.MOT_CLIENT_SECRET || "dummy-client-secret";
const apiKey = process.env.MOT_API_KEY || "dummy-api-key";
```

> It uses dummy values if you don't set environment variables, allowing folks to run tests without real credentials.

b. You can set the environment variables before running the tests to use real credentials:

```sh
export MOT_CLIENT_ID=enter_real_client-id
export MOT_CLIENT_SECRET=enter_real_client_secret
export MOT_API_KEY=enter_real_api_key
npm run test
```

Unset the environment variables after completing the tests:

```sh
unset MOT_CLIENT_ID && unset MOT_CLIENT_SECRET && unset MOT_API_KEY
```

### Installation

To install the package, run the following command:

```bash
npm install mot-js-sdk
```

### Integration Example

Here is an example of how you can use the SDK to build real-world applications:

```javascript
import MotApiSdk from 'mot-js-sdk';

// Initialize the SDK with your credentials
const sdk = new MotApiSdk(
  process.env.MOT_CLIENT_ID!,
  process.env.MOT_CLIENT_SECRET!,
  process.env.MOT_API_KEY!
);

async function integrateMotApiSdk() {
  try {
    // Retrieve vehicle by registration
    console.log("Retrieving vehicle by registration:");
    const vehicleByReg = await sdk.getVehicleByRegistration('AB12CDE');
    console.log(vehicleByReg);

    // Retrieve vehicle by VIN
    console.log("\nRetrieving vehicle by VIN:");
    const vehicleByVin = await sdk.getVehicleByVin('WBAJL51050G799651');
    console.log(vehicleByVin);

    // Bulk download
    console.log("\nBulk download data:");
    const bulkDownload = await sdk.getBulkDownload();
    console.log(bulkDownload);

    // Renew credentials
    console.log("\nRenewing credentials:");
    const newCredentials = await sdk.renewCredentials({
      awsApiKeyValue: process.env.MOT_API_KEY!,
      email: 'firstname.lastname@example.com'
    });
    console.log("New client secret:", newCredentials.clientSecret);

  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the integration
integrateMotApiSdk();
```

Set up your environment variables:

```sh
export MOT_CLIENT_ID=enter_real_client_id
export MOT_CLIENT_SECRET=enter_real_client_secret
export MOT_API_KEY=enter_real_api_key
```

Execute the script with `ts-node`:

```sh
ts-node mot-js-sdk-integration.ts
```

### Setting up a MOT History API

You can use this support form to request an [API Key](https://documentation.history.mot.api.gov.uk/mot-history-api/register).


### Using the MOT History API

You can read the [API documentation](https://documentation.history.mot.api.gov.uk/) to understand what's possible with the MOT History API. If you need further assistance, don't hesitate to [contact the DVSA](https://documentation.history.mot.api.gov.uk/mot-history-api/support).


### License

This project is licensed under the [MIT License](./LICENSE).

### Copyright

(c) 2024 [Finbarrs Oketunji](https://finbarrs.eu).

The MOT History API Go SDK is Licensed under the [Open Government Licence v3.0](
https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
