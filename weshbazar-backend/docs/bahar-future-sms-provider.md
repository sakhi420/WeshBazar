# Bahar Future SMS provider

WeshBazar includes a dedicated adapter for the Bahar Future SMS HTTP API. It
uses the existing OTP service and does not add or change any public WeshBazar
API endpoint, database table, or OpenAPI contract.

## Before enabling

1. Create and obtain approval for an account at https://sms.baharfuture.com/signup.
2. Confirm the account is active and has prepaid balance.
3. Confirm the operator routes required by WeshBazar's users (AWCC, Roshan,
   Etisalat, ATOMA and Salaam).
4. Register the sender ID with the required operators before configuring it.
5. Test real delivery with a controlled number on each reachable operator.

## Render environment

Set these on the API service in Render's private Environment page:

```env
SMS_PROVIDER=bahar-future
BAHAR_FUTURE_USERNAME=<account username>
BAHAR_FUTURE_PASSWORD=<account password>
BAHAR_FUTURE_SENDER_ID=<optional approved sender ID>
BAHAR_FUTURE_TIMEOUT_MS=10000
BAHAR_FUTURE_MAX_RETRIES=2
```

The shared `SMS_MESSAGE_TEMPLATE` supplies the Dari text. The default is:

```text
وزبازار: کد تأیید شما {code} است
```

Never commit credentials or include them in a support ticket, screenshot, URL,
or source file. Do not put them in the frontend environment.

## Request and response handling

- HTTPS POST to `https://sms.baharfuture.com/send`.
- Body uses URL-encoded form fields: `username`, `password`, `to`, `content`
  and optional `from`.
- Stored Afghan E.164 phone numbers such as `+93700000000` are sent as
  `93700000000` (digits only, no plus sign).
- A successful HTTP 200 must contain a non-empty message ID.
- HTTP 400 is treated as argument/destination validation failure.
- HTTP 403 is reported as authentication or insufficient-balance failure.
- HTTP 412 means no route is currently active for the destination operator.
- HTTP 500 is retried with bounded exponential backoff because the vendor says
  the message was not accepted by the operator.
- Network errors/timeouts are not automatically retried because acceptance may
  be ambiguous and a retry could send a duplicate SMS.
- Credentials are sent in the POST body, never in the query string.
- Delivery receipts are not enabled. They need a public callback endpoint,
  which is intentionally excluded to preserve the frozen API contract.

A provider HTTP 200 means the gateway accepted the submission; it does not
prove the handset received the message. Confirm delivery with actual operator
SIM tests before enabling public registration.
