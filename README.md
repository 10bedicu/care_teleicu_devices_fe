# CARE TeleICU Devices Plugin

A CARE plugin that adds support for managing TeleICU hardware in CARE — Gateways,
HL7 Vitals Monitors, and IP Cameras — directly from the facility, location, and
encounter views.

## Overview

This plugin extends CARE's device management with three integrated device types
used in TeleICU deployments:

- **Gateway** — an on-premise bridge that connects bedside hardware (vitals
  monitors, cameras) to CARE. Provides health checks and acts as the
  middleware for device communication.
- **HL7 Vitals Monitor** — a bedside patient monitor that streams HL7 vitals
  data through the Gateway. The plugin renders a live waveform/vitals view in
  the encounter overview.
- **Camera** — a PTZ-capable IP camera. The plugin provides a live feed
  player, position presets, and PTZ controls scoped to bed/location.

## Features

- **Device configuration forms** for Gateway, HL7 Vitals Monitor, and Camera
  device types, integrated into CARE's device configuration flow.
- **Show-page cards** rendered on each device's detail page with status,
  metadata, and quick actions.
- **Encounter overview widgets**:
  - Live HL7 vitals waveforms and numerics from the bedside monitor.
  - Live camera feed with PTZ controls and saved position presets.
- **Gateway health checks** to surface connectivity and middleware status.
- **Camera position presets** linked to locations, with reordering support.
- **Inbuilt presets and preset dropdown** for quick PTZ navigation.
- **Keyboard shortcuts** for camera control.
- **i18n** via `react-i18next` (locales in `public/locale/`).

## Where to Find This Plugin in CARE

Once registered, this plugin contributes to the following surfaces in CARE:

1. **Device Configuration** — When adding or editing a device of type
   `gateway`, `camera`, or `vitals-observation`, the plugin's configuration
   form is rendered.
2. **Device Show Page** — Each supported device type renders a plugin-provided
   card on its detail page.
3. **Encounter Overview** — For encounters with associated camera or vitals
   monitor devices, the plugin contributes live feed and vitals widgets.

## Setup

### Prerequisites

- Node.js `>=22.9.0`
- A running CARE instance with plugin support

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ohcnetwork/care_teleicu_devices_fe.git
   cd care_teleicu_devices_fe
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the dev build with file watching and a preview server:

```bash
npm run start
```

The plugin will be served at `http://localhost:10120` and exposes a Module
Federation `remoteEntry.js` that CARE consumes.

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Lint / Format

```bash
npm run lint
npm run lint-fix
npm run format
```

## Registering the Plugin in CARE

After running the plugin locally (or deploying it), register it in your CARE
instance:

1. Open your CARE instance and log in as an administrator.
2. Navigate to the **Admin Dashboard**.
3. Click **Apps** in the sidebar.
4. Locate **CARE TeleICU Devices** and open its details.
5. Click **Start setup** and follow the on-screen instructions.

> **Note**: For production deployments, replace `http://localhost:10120` with
> your production URL.

## Architecture

This plugin is a Vite + React 19 application built as a Module Federation
remote (`@originjs/vite-plugin-federation`). CARE loads the plugin's
`./manifest` export at runtime, which declares the supported device types and
their UI surfaces:

```ts
// src/manifest.ts
devices: [
  { type: "gateway",            configureForm, showPageCard },
  { type: "camera",             configureForm, showPageCard, encounterOverview },
  { type: "vitals-observation", configureForm, showPageCard, encounterOverview },
]
```

Key folders:

- `src/components/{gateway,camera,vitals-observation}/` — device-specific UI
  (configure form, show-page card, encounter overview).
- `src/lib/camera/` — camera feed player, PTZ actions, preset APIs.
- `src/lib/vitals-observation/hl7-monitor/` — HL7 device client and waveform
  renderer.
- `src/lib/device/` — shared device API and hooks (including gateway health
  checks).

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and
`npm run format` before submitting changes.

## License

[MIT](LICENSE)
