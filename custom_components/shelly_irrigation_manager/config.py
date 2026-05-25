import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .websocket_api import async_register_websockets

CONFIG_SCHEMA = vol.Schema(
    {DOMAIN: vol.Schema({})},
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: dict):
    async_register_websockets(hass)
    return True
