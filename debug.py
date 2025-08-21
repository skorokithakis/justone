#!/usr/bin/env python3
import argparse
import json

import requests


def main():
    parser = argparse.ArgumentParser(
        description="Fetch and display messages from gweet.stavros.io"
    )
    parser.add_argument("room", help="Room identifier (e.g., 'asda')")
    args = parser.parse_args()

    url = f"https://gweet.stavros.io/stream/justone-stavros-{args.room}/"
    params = {"latest": 50}

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json()
    messages = data.get("messages", [])

    for message in messages:
        values = message["values"].copy()
        message_type = values.pop("type", ["unknown"])[0]
        values.pop("messageId", None)
        values.pop("user", None)

        # Format the output compactly.
        output_parts = [f"Type: {message_type}"]
        for key, value in values.items():
            output_parts.append(f"{key}: {value[0]}")

        print(" | ".join(output_parts))


if __name__ == "__main__":
    main()
