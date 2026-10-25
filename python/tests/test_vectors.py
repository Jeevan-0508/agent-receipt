import json
from pathlib import Path

import pytest

from python.verify import verify_package

VECTOR_DIR = Path(__file__).parents[2] / "test-vectors" / "v0.1"


@pytest.mark.parametrize("path", sorted(VECTOR_DIR.glob("*.json")), ids=lambda path: path.stem)
def test_shared_vector(path):
    vector = json.loads(path.read_text(encoding="utf-8"))
    result = verify_package(vector["package"], vector["trustedKeys"])
    assert result["overall"] == vector["expected"]
