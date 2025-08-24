#!/usr/bin/env python3
"""Insert a word into a sorted wordlist file."""
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python insert_word.py <wordlist_file> <word>", file=sys.stderr)
        sys.exit(1)

    wordlist_path = Path(sys.argv[1])
    word_to_insert = sys.argv[2].strip()

    if not wordlist_path.exists():
        print(f"Error: File '{wordlist_path}' does not exist", file=sys.stderr)
        sys.exit(1)

    # Read existing words into a set.
    with open(wordlist_path, "r", encoding="utf-8") as file:
        words = {line.strip() for line in file if line.strip()}

    # Check if word already exists.
    if word_to_insert.lower() in set(x.lower() for x in words):
        print(
            f"Error: Word '{word_to_insert}' already exists in {wordlist_path}",
            file=sys.stderr,
        )
        sys.exit(1)

    # Add the new word and sort alphabetically.
    words.add(word_to_insert)
    sorted_words = sorted(words)

    # Write back to file.
    with open(wordlist_path, "w", encoding="utf-8") as file:
        for word in sorted_words:
            file.write(word + "\n")

    print(
        f"Successfully added '{word_to_insert}' to {wordlist_path} ({len(words)} words in total)"
    )


if __name__ == "__main__":
    main()
