from homeassistant.components import websocket_api

from .device_resolver import get_device_ip_from_entity
from .shelly_rpc import rpc_call
from .parser import parse_schedule_list, build_timespec


def async_register_websockets(hass):

    @websocket_api.websocket_command(
        {
            "type": "shelly_irrigation/get_schedule",
            "entity_id": str,
        }
    )
    @websocket_api.async_response
    async def get_schedule(hass, connection, msg):
        entity_id = msg["entity_id"]
        ip = get_device_ip_from_entity(hass, entity_id)

        if not ip:
            connection.send_error(
                msg["id"],
                "missing_ip",
                f"Could not resolve Shelly IP for {entity_id}",
            )
            return

        try:
            schedules = await rpc_call(ip, "Schedule.List")
            switch_config = await rpc_call(ip, "Switch.GetConfig", {"id": 0})

            connection.send_result(
                msg["id"],
                {
                    "entity_id": entity_id,
                    "ip": ip,
                    "schedule": parse_schedule_list(schedules),
                    "auto_off": {
                        "enabled": switch_config.get("auto_off"),
                        "delay_seconds": switch_config.get("auto_off_delay"),
                    },
                    "raw": {
                        "schedules": schedules,
                        "switch_config": switch_config,
                    },
                },
            )

        except Exception as err:
            connection.send_error(msg["id"], "rpc_error", str(err))

    @websocket_api.websocket_command(
        {
            "type": "shelly_irrigation/save_schedule",
            "entity_id": str,
            "days": list,
            "times": list,
            "duration_minutes": int,
            "sync_auto_off": bool,
        }
    )
    @websocket_api.async_response
    async def save_schedule(hass, connection, msg):
        entity_id = msg["entity_id"]
        ip = get_device_ip_from_entity(hass, entity_id)

        if not ip:
            connection.send_error(
                msg["id"],
                "missing_ip",
                f"Could not resolve Shelly IP for {entity_id}",
            )
            return

        days = msg["days"]
        times = msg["times"]
        duration_seconds = msg["duration_minutes"] * 60

        try:
            existing = await rpc_call(ip, "Schedule.List")

            for job in existing.get("jobs", []):
                await rpc_call(ip, "Schedule.Delete", {"id": job["id"]})

            for time_str in times:
                await rpc_call(
                    ip,
                    "Schedule.Create",
                    {
                        "enable": True,
                        "timespec": build_timespec(time_str, days),
                        "calls": [
                            {
                                "method": "Switch.Set",
                                "params": {
                                    "id": 0,
                                    "on": True,
                                    "toggle_after": duration_seconds,
                                },
                            }
                        ],
                    },
                )

            await rpc_call(
                ip,
                "Switch.SetConfig",
                {
                    "id": 0,
                    "config": {
                        "auto_off": msg["sync_auto_off"],
                        "auto_off_delay": duration_seconds,
                    },
                },
            )

            schedules = await rpc_call(ip, "Schedule.List")
            switch_config = await rpc_call(ip, "Switch.GetConfig", {"id": 0})

            connection.send_result(
                msg["id"],
                {
                    "success": True,
                    "schedule": parse_schedule_list(schedules),
                    "auto_off": {
                        "enabled": switch_config.get("auto_off"),
                        "delay_seconds": switch_config.get("auto_off_delay"),
                    },
                },
            )

        except Exception as err:
            connection.send_error(msg["id"], "rpc_error", str(err))

    @websocket_api.websocket_command(
        {
            "type": "shelly_irrigation/delete_schedule",
            "entity_id": str,
        }
    )
    @websocket_api.async_response
    async def delete_schedule(hass, connection, msg):
        entity_id = msg["entity_id"]
        ip = get_device_ip_from_entity(hass, entity_id)

        if not ip:
            connection.send_error(
                msg["id"],
                "missing_ip",
                f"Could not resolve Shelly IP for {entity_id}",
            )
            return

        try:
            existing = await rpc_call(ip, "Schedule.List")

            for job in existing.get("jobs", []):
                await rpc_call(ip, "Schedule.Delete", {"id": job["id"]})

            await rpc_call(
                ip,
                "Switch.SetConfig",
                {
                    "id": 0,
                    "config": {
                        "auto_off": False,
                    },
                },
            )

            connection.send_result(
                msg["id"],
                {
                    "success": True,
                    "schedule": {
                        "valid": True,
                        "days": [],
                        "times": [],
                        "duration_seconds": None,
                        "duration_minutes": None,
                    },
                    "auto_off": {
                        "enabled": False,
                        "delay_seconds": None,
                    },
                },
            )

        except Exception as err:
            connection.send_error(msg["id"], "rpc_error", str(err))

    websocket_api.async_register_command(hass, get_schedule)
    websocket_api.async_register_command(hass, save_schedule)
    websocket_api.async_register_command(hass, delete_schedule)
