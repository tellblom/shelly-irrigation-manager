import aiohttp


async def rpc_call(ip: str, method: str, params=None):

    url = f"http://{ip}/rpc"

    payload = {"id": 1, "method": method, "params": params or {}}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            response.raise_for_status()

            data = await response.json()

            return data.get("result", data)
