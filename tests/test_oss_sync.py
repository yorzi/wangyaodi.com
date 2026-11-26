import json
import runpy
import unittest
from pathlib import Path
from unittest.mock import patch


sync = runpy.run_path(str(Path(__file__).resolve().parents[1] / "bin/oss-sync"))
repo = "example/project"


def search_page(numbers, total, incomplete=False):
    return {
        "incomplete_results": incomplete,
        "total_count": total,
        "items": [{"repository_url": f"https://api.github.com/repos/{repo}", "number": n} for n in numbers],
    }


class SyncTest(unittest.TestCase):
    def fetch(self, pages):
        fetch = sync["fetch_merged"]
        with patch.dict(fetch.__globals__, gh=lambda args: json.dumps(pages)):
            return fetch({"author": "contributor"}, {(repo, 1), (repo, 2)}, False)

    def test_incomplete_search_cannot_reach_reconciliation(self):
        cases = [
            [search_page([1], 1, incomplete=True)],
            [search_page([1], 2)],
            [search_page([1], 2), search_page([1], 2)],
            [search_page([1], 2), search_page([2], 3)],
        ]
        for pages in cases:
            with self.subTest(pages=pages), self.assertRaises(SystemExit):
                self.fetch(pages)

    def test_complete_pages_can_remove_a_previously_listed_pr(self):
        prs = [{"number": n, "merged": "2026-11-01"} for n in (1, 2, 3)]
        data = {"meta": {"author": "contributor"}, "projects": [{"repo": repo, "prs": prs}]}
        found = self.fetch([search_page([1], 2), search_page([2], 2)])
        refreshed = sync["merge_data"](data, found, False)
        self.assertEqual([p["number"] for p in refreshed["projects"][0]["prs"]], [2, 1])
