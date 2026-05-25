class ShellyIrrigationCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this._initialLoadDone = false;
  }

  connectedCallback() {
    this._connected = true;
    this.tryInitialLoad();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._rendered) {
      this._rendered = true;
      this.render();
    }

    this.tryInitialLoad();
  }

  tryInitialLoad() {
    if (this._initialLoadDone) return;
    if (!this._connected) return;
    if (!this._hass) return;
    if (!this.config?.entity) return;
    if (!this.querySelector("#load")) return;

    this._initialLoadDone = true;

    setTimeout(() => {
      this.loadSchedule();
    }, 500);
  }

  render() {
    const name = this.config.name || this.config.entity;

    this.innerHTML = `
      <ha-card>
        <div style="padding:16px; display:grid; gap:14px; max-width:320px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:20px; font-weight:600;">${name}</div>
              <div style="opacity:.7; font-size:13px;">${this.config.entity}</div>
            </div>
            <div id="status" style="font-size:13px; opacity:.8;">Loading...</div>
          </div>

          <div id="next" style="font-size:18px; font-weight:600;">
            Next irrigation: ...
          </div>

          <div>
            <div style="font-weight:600; margin-bottom:6px;">Days</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">             
              ${this.dayCheckbox("MON", "Mon")}
              ${this.dayCheckbox("TUE", "Tue")}
              ${this.dayCheckbox("WED", "Wed")}
              ${this.dayCheckbox("THU", "Thu")}
              ${this.dayCheckbox("FRI", "Fri")}
              ${this.dayCheckbox("SAT", "Sat")}
              ${this.dayCheckbox("SUN", "Sun")}
            </div>
          </div>

          <label>
            <div style="font-weight:600; margin-bottom:6px;">Start times</div>
            <input id="times" style="width:100%; box-sizing:border-box;" placeholder="08:00,12:00,18:00">
          </label>

          <label>
            <div style="font-weight:600; margin-bottom:6px;">Duration in minutes</div>
            <input id="duration" type="number" min="1" style="width:100%; box-sizing:border-box;" placeholder="10">
          </label>

          <label style="display:flex; gap:8px; align-items:center;">
            <input id="autooff" type="checkbox">
            <span>Use duration as AutoOff</span>
          </label>

          <div style="display:flex; gap:8px;">
            <button id="save" style="flex:1;">Save</button>
            <button id="load" style="flex:1;">Reload</button>
            <button id="delete" style="flex:1;">Delete Schedule</button>
          </div>

          <div id="message" style="font-size:13px;"></div>
        </div>
      </ha-card>
    `;

    this.querySelector("#load").onclick = () => this.loadSchedule();
    this.querySelector("#save").onclick = () => this.saveSchedule();
    this.querySelector("#delete").onclick = () => this.deleteSchedule();
  }

  dayCheckbox(value, label) {
    return `
      <label style="display:flex; gap:4px; align-items:center;">
        <input type="checkbox" value="${value}" class="day">
        ${label}
      </label>
    `;
  }

  setStatus(text) {
    this.querySelector("#status").textContent = text;
  }

  setMessage(text, isError = false) {
    const el = this.querySelector("#message");
    el.textContent = text;
    el.style.color = isError ? "var(--error-color)" : "var(--primary-text-color)";
  }

  validateInput(days, times, duration) {
    if (!days.length) return "Set at least one day.";
    if (!times.length) return "Set at least one start time.";
    if (!duration || duration < 1) return "Duration has to be at least 1 minute.";

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    for (const time of times) {
      if (!timeRegex.test(time)) {
        return `Incorrect time format: ${time}. Use format 08:00.`;
      }
    }

    if (times.length > 6) return "Max 6 start times per zone.";

    return null;
  }

  async loadSchedule() {
    this.setStatus("Loading...");
    this.setMessage("");

    try {
      const result = await this._hass.callWS({
        type: "shelly_irrigation/get_schedule",
        entity_id: this.config.entity,
      });

      this.applySchedule(result);
      this.setStatus("Synced");
      this.setMessage("Scheduled read from the Shelly device.");
    } catch (err) {
      this.setStatus("Error");
      this.setMessage(this.formatError(err), true);
    }
  }

  async saveSchedule() {
    const days = [...this.querySelectorAll(".day:checked")].map(el => el.value);

    const times = this.querySelector("#times").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const duration = parseInt(this.querySelector("#duration").value, 10);
    const syncAutoOff = this.querySelector("#autooff").checked;

    const validationError = this.validateInput(days, times, duration);
    if (validationError) {
      this.setMessage(validationError, true);
      return;
    }

    this.setStatus("Saving...");
    this.setMessage("");

    try {
      const result = await this._hass.callWS({
        type: "shelly_irrigation/save_schedule",
        entity_id: this.config.entity,
        days,
        times,
        duration_minutes: duration,
        sync_auto_off: syncAutoOff,
      });

      this.applySchedule(result);
      this.setStatus("Saved");
      this.setMessage("Schedule saved to the Shelly device.");
    } catch (err) {
      this.setStatus("Error");
      this.setMessage(this.formatError(err), true);
    }
  }

  async deleteSchedule() {
    const confirmed = confirm(
      "Delete all irrigation schedules from this Shelly?"
    );

    if (!confirmed) return;

    this.setStatus("Deleting...");
    this.setMessage("");

    try {
      const result = await this._hass.callWS({
        type: "shelly_irrigation/delete_schedule",
        entity_id: this.config.entity,
      });

      this.applySchedule(result);
      this.setStatus("Deleted");
      this.setMessage("Schedule deleted from Shelly.");
    } catch (err) {
      this.setStatus("Error");
      this.setMessage(this.formatError(err), true);
    }
  }




  applySchedule(result) {
    const schedule = result.schedule;
    if (!schedule) return;

    this.querySelectorAll(".day").forEach(el => {
      el.checked = schedule.days.includes(el.value);
    });

    this.querySelector("#times").value = schedule.times.join(",");
    this.querySelector("#duration").value = schedule.duration_minutes || "";

    if (result.auto_off) {
      this.querySelector("#autooff").checked = !!result.auto_off.enabled;
    }

    this.querySelector("#next").textContent =
      "Next irrigation: " + this.calculateNext(schedule.days, schedule.times);
  }

  calculateNext(days, times) {
    if (!days.length || !times.length) return "Not Scheduled";

    const dayMap = {
      SUN: 0,
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
    };

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const now = new Date();
    let best = null;

    for (let i = 0; i < 8; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);

      const dayKey = Object.keys(dayMap).find(k => dayMap[k] === date.getDay());
      if (!days.includes(dayKey)) continue;

      for (const time of times) {
        const [h, m] = time.split(":").map(Number);
        const candidate = new Date(date);
        candidate.setHours(h, m, 0, 0);

        if (candidate <= now) continue;
        if (!best || candidate < best) best = candidate;
      }
    }

    if (!best) return "Not Scheduled";

    return `${dayNames[best.getDay()]} ${String(best.getHours()).padStart(2, "0")}:${String(best.getMinutes()).padStart(2, "0")}`;
  }

  formatError(err) {
    if (err?.message) return err.message;
    if (err?.code && err?.message) return `${err.code}: ${err.message}`;
    return JSON.stringify(err);
  }
}

customElements.define("shelly-irrigation-card", ShellyIrrigationCard);