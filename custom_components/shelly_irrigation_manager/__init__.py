from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

from .websocket_api import async_register_websockets

DOMAIN = "shelly_irrigation_manager"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:

    if not hass.data.get(DOMAIN):
        hass.data[DOMAIN] = {}

    if not hass.data[DOMAIN].get("websocket_registered"):
        async_register_websockets(hass)
        hass.data[DOMAIN]["websocket_registered"] = True

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True
