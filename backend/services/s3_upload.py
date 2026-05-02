import uuid
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from config import get_settings


LOCAL_PRODUCT_IMAGE_DIR = Path(__file__).resolve().parents[1] / "static" / "product-images"


def is_s3_configured() -> bool:
    settings = get_settings()
    return all(
        [settings.aws_bucket_name, settings.aws_region, settings.aws_access_key_id, settings.aws_secret_access_key]
    )


def upload_product_image(file_content: bytes, content_type: str, filename: str) -> str:
    settings = get_settings()
    if not is_s3_configured():
        raise RuntimeError("AWS S3 is not fully configured")

    key = f"products/{uuid.uuid4().hex}_{filename}"
    client = boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )
    try:
        client.put_object(
            Bucket=settings.aws_bucket_name,
            Key=key,
            Body=file_content,
            ContentType=content_type or "application/octet-stream",
        )
    except ClientError as e:
        raise RuntimeError("S3 upload failed") from e

    return f"https://{settings.aws_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"


def save_product_image_locally(file_content: bytes, filename: str, base_url: str) -> str:
    suffix = Path(filename).suffix.lower()
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    LOCAL_PRODUCT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    (LOCAL_PRODUCT_IMAGE_DIR / stored_name).write_bytes(file_content)
    return f"{base_url.rstrip('/')}/media/product-images/{stored_name}"


def store_product_image(file_content: bytes, content_type: str, filename: str, base_url: str) -> str:
    if is_s3_configured():
        return upload_product_image(file_content, content_type, filename)
    return save_product_image_locally(file_content, filename, base_url)
