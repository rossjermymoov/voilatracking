# HeyVoila Queue Tracking CSV Uploader

A modern, full-featured web application to upload courier shipment CSVs, flexibly map columns to the **[HeyVoila Queue Tracking API](https://api.heyvoila.io/#36c67498-1559-41e3-8fab-78cfcf0c8c4e)** (`https://app.heyvoila.io/api/couriers/v1/{{Courier Key}}/queue-tracking`), securely store credentials, and execute batch tracking events with real-time feedback.

---

## 🚀 Features

- **🔑 Secure API Key Storage**: Store `api-user`, `api-token`, `auth_company`, and `testing` sandbox mode locally in your browser.
- **⚡ Built-in Test Connection**: Test your API credentials against HeyVoila with live courier list validation.
- **📁 Drag & Drop CSV Uploader**: Fast client-side CSV parsing with instant row counts, column inspection, and pre-formatted sample template download.
- **✨ Smart Auto-Mapping**: Automatic fuzzy column header detection for tracking numbers, order references, recipient addresses, and dates.
- **🗂️ Reusable Mapping Presets**: Save and load custom mapping profiles for different sales channels (Shopify, Amazon, ERP, etc.).
- **👁️ Live JSON Payload Inspector**: Preview the exact generated API payload for any row in your CSV before queueing.
- **🔄 Batch Queue Runner**:
  - Configurable worker concurrency (1 to 10 concurrent requests)
  - Rate limiting delay controls (0ms to 500ms)
  - Pause, resume, and cancel execution
  - Real-time progress tracking (Success / Failed / Pending)
  - Retry failed rows with a single click
  - Full request payload & API response inspector for every row
- **📊 Results Export**: Download an enriched CSV with HeyVoila `shipment_id`, `tracking_request_id`, status, and error logs.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 📖 How It Works

### Step 1: Configure Credentials
1. Click **Configure API Keys** in the top navigation.
2. Enter your **API User** (from the `name` column in [HeyVoila API Users](https://app.heyvoila.io/controlpanel/apiusers)).
3. Enter your **API Token** (generated via *View Tokens* in the control panel).
4. Select your default courier (e.g. `AmazonShipping`, `DHL`, `RoyalMail`, `DPD`, `Evri`, etc.).
5. (Optional) Toggle **Sandbox / Testing Mode** to test without creating live production tracking events.
6. Click **Test Connection** to verify your setup.

### Step 2: Upload CSV
- Drag and drop your CSV file or click to browse.
- If you need a starting template, click **Download Sample CSV**.

### Step 3: Map Columns
- Click **Smart Auto-Map** to auto-detect matching columns.
- Adjust field mappings (e.g. `tracking_codes`, `reference`, `ship_to` addresses).
- Set static default fallback values if any column is missing in your CSV.
- Save your configuration as a preset for future uploads.
- Click **Preview JSON Payload** to verify the output.

### Step 4: Review & Queue
- Choose your desired concurrency and rate delay.
- Click **Start Queueing** to submit tracking events to HeyVoila in batches.
- Monitor progress and error messages in real-time.
- Export results to CSV when complete.

---

## 🔗 HeyVoila API Reference

- **Endpoint**: `POST https://app.heyvoila.io/api/couriers/v1/{{Courier Key}}/queue-tracking`
- **Headers**:
  - `api-user`: Your API user name
  - `api-token`: Your API token
  - `Content-Type`: `application/json`
- **Official Docs**: [https://api.heyvoila.io/#36c67498-1559-41e3-8fab-78cfcf0c8c4e](https://api.heyvoila.io/#36c67498-1559-41e3-8fab-78cfcf0c8c4e)
