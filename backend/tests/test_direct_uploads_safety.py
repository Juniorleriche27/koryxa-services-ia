import io
import pytest
from starlette.datastructures import UploadFile

from app.api.routes.direct_uploads import read_upload_file_safely
from app.core.errors import ApplicationError


@pytest.mark.asyncio
async def test_read_upload_file_safely_normal_file() -> None:
    data = b"Hello world! This is a test file for streaming upload."
    file = UploadFile(file=io.BytesIO(data), filename="test.txt")
    result = await read_upload_file_safely(file, max_bytes=1024)
    assert result == data


@pytest.mark.asyncio
async def test_read_upload_file_safely_file_too_large() -> None:
    data = b"x" * 1500
    file = UploadFile(file=io.BytesIO(data), filename="large.bin")
    with pytest.raises(ApplicationError) as exc_info:
        await read_upload_file_safely(file, max_bytes=1000)
    assert exc_info.value.code == "file_too_large"
    assert exc_info.value.status_code == 413
