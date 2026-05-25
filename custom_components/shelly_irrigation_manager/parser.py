def parse_timespec(timespec: str):
    parts = timespec.split()
    if len(parts) != 6:
        return None

    second, minute, hour, _dom, _month, days = parts

    if second != "0":
        return None

    return {
        "time": f"{int(hour):02d}:{int(minute):02d}",
        "days": days.split(",") if days != "*" else [],
    }

def build_timespec(time_str: str, days: list[str]) -> str:
    hour, minute = time_str.split(":")

    return f"0 {int(minute)} {int(hour)} * * {','.join(days)}"


def parse_schedule_list(schedule_result: dict):
    jobs = schedule_result.get("jobs", [])

    times = []
    days = None
    duration_seconds = None
    valid = True

    for job in jobs:
        parsed = parse_timespec(job.get("timespec", ""))
        if not parsed:
            valid = False
            continue

        calls = job.get("calls", [])
        if not calls:
            valid = False
            continue

        params = calls[0].get("params", {})
        toggle_after = params.get("toggle_after")

        if toggle_after is None:
            valid = False
            continue

        if days is None:
            days = parsed["days"]
        elif days != parsed["days"]:
            valid = False

        if duration_seconds is None:
            duration_seconds = toggle_after
        elif duration_seconds != toggle_after:
            valid = False

        times.append(parsed["time"])

    times.sort()

    return {
        "valid": valid,
        "days": days or [],
        "times": times,
        "duration_seconds": duration_seconds,
        "duration_minutes": int(duration_seconds / 60) if duration_seconds else None,
    }
