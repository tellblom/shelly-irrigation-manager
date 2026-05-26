# Shelly Irrigation Manager

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Integration-41BDF5?logo=home-assistant)](https://www.home-assistant.io/)
[![release](https://img.shields.io/github/v/release/tellblom/shelly-irrigation-manager?display_name=tag)](https://github.com/tellblom/shelly-schedule-manager/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/arboeh/shABman/blob/main/LICENSE)
[![maintained](https://img.shields.io/maintenance/yes/2026)](https://github.com/arboeh/shABman/graphs/commit-activity)
[![Shelly](https://img.shields.io/badge/Shelly-Gen2%2FGen3-00A1DF?logo=shelly)](https://shelly.cloud)


Manage and control your irrigation with **Shelly Irrigation Manager** directly from Home Assistant with a clean and user-friendly interface.
It saves the schedules to the Shelly device and are not dependent on WiFi or HomeAssitant control
---

## ✨ Features

- 📅 Schedule irrigation 
- ➕ Create new schedules
- ✏️ Edit existing schedules
- 🗑️ Delete schedules
- 🔄 Sync devices manually

## Lovelace Card
<img width="393" height="399" alt="image" src="https://github.com/user-attachments/assets/0d4e6903-3893-439c-b52c-e34ba86749ef" />

---

## ⚙️ Supported Devices

### ✅ Gen2 / Gen3 / Gen4 (RPC-based)
⚠️You should only use Shellys with Dry Contacts (like Shelly 1 Mini Gen3/Gen4)

Full schedule support:

- Create irrigation schedules
- Edit schedules
- Delete schedules

---

## Dependencies

- Depends on Shelly integration (to be able to get the IP of the Shelly Device) 

## Limitations
### ⚠️ Gen1 Devices are not supported
### ⚠️ All schedules on the Shelly WILL BE OVERWRITTEN




## Installation 
1. Copy both bot custom_componets and www folders to your /config folder in home assistant
2. Edit a Dashboard and go to the three dots i the upper right corner. Choose Manage Resources  and click  +Add Reaurce
3. Enter: /local/shelly-irrigation-manager/shelly-irrigation-card.js in the URL. and choose JavaScript module
<img width="399" height="318" alt="image" src="https://github.com/user-attachments/assets/8ef52ff6-7420-4d99-923f-a39af4d6a089" />

4. Restart Home Assitant
5. Go to Settings -> Devices & Services and press +Add integration button
6. Search for Shelly and choose Shelly integration Manager
7. Installed

## Usage
1. In a dashboard add a manual card (at the bottom)
2. Enter the following information (where  switch.frontzon2 is the name of your Shelly entity)
```YAML
type: custom:shelly-irrigation-card
entity: switch.frontzon2
name: ZON 2 Poolside plants
```

3. If you want to show history as well I suggest this cad (the one I use) 
```YAML
type: vertical-stack
cards:
  - type: custom:shelly-irrigation-card
    entity: switch.frontzon2
    name: ZON 2 Poolside plants
  - type: history-graph
    entities:
      - entity: switch.frontzon2
        name: ZON 2 History
    hours_to_show: 24
    refresh_interval: 0
```


In the top of my dashboard I have this:

<img width="320" height="270" alt="image" src="https://github.com/user-attachments/assets/eaeb646c-7cf9-4749-abc3-dc694b8f5b72" />

Thats just a regular entity card 

The Pause irrigation is just a input_boolean that if active turns of the irrigation as soon as its detected. 
⚠️ This function depends on that the Shelly is communication with HomeAssistant 

